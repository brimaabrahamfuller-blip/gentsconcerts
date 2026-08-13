const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const pushNotificationService = require('../services/pushNotificationService');

const signToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    });
};

// Generate a 32-char hex token (256 bits)
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

exports.register = async (req, res) => {
    try {
        console.log('[REGISTER] Starting registration process for email:', req.body.email);
        console.log('[REGISTER] Full request body:', JSON.stringify(req.body));
        let { fullName, email, phone, password, expoPushToken, referralCode } = req.body;

        // Standardize email
        if (email) {
            email = email.toLowerCase().trim();
        }

        // Public sign-up always creates an attendee account. Hosting is a
        // reviewed privilege requested later from the account area; accepting a
        // client-supplied role here would allow self-service marketplace access.
        const validRole = 'attendee';

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('[REGISTER] User already exists:', email);
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        let referringUser = null;
        if (referralCode) {
            referringUser = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
            if (!referringUser) {
                return res.status(400).json({ success: false, message: 'Invalid referral code' });
            }
        }

        // Generate email verification token
        const verificationToken = generateToken();
        const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        console.log('[REGISTER] Creating new user:', email);
        const newUser = await User.create({
            fullName,
            email,
            phone,
            password,
            role: validRole,
            hostApprovalStatus: 'not_requested',
            verificationToken,
            verificationTokenExpires: verificationExpires,
            isVerified: true,
            expoPushToken: expoPushToken || null,
            referredBy: referringUser ? referringUser._id : undefined
        });
        if (referringUser) {
            await User.findByIdAndUpdate(referringUser._id, { $inc: { referralCount: 1 } });
        }
        console.log('[REGISTER] User created with role:', newUser.role);
        console.log('[REGISTER] User created successfully:', email);

        // Auto-login after registration (token returned for convenience)
        const token = signToken(newUser._id, newUser.role);

        // Send verification email (FIRE-AND-FORGET: do NOT await to avoid blocking response)
        emailService.sendVerificationEmail(newUser, verificationToken).catch(err => {
            console.error(`[REGISTER] Failed to send verification email to ${newUser.email}:`, err.message);
        });

        console.log('[REGISTER] Sending success response for:', email);
        res.status(201).json({
            success: true,
            token,
            message: 'Account created successfully! You can now explore events and request host access from your profile when ready.',
            data: { user: newUser }
        });
    } catch (error) {
        console.error('[REGISTER] Error during registration:', error.message);
        res.status(400).json({ 
            success: false, 
            message: error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.login = async (req, res) => {
    try {
        console.log('[LOGIN] Starting login process for email:', req.body.email);
        let { email, password, expoPushToken } = req.body;

        if (!email || !password) {
            console.log('[LOGIN] Missing email or password');
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Standardize email
        email = email.toLowerCase().trim();
        console.log('[LOGIN] Looking up user:', email);

        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            console.log('[LOGIN] Invalid credentials for:', email);
            return res.status(401).json({ success: false, message: 'Incorrect email or password' });
        }
        console.log('[LOGIN] User found and password verified:', email);

        // Check if email is verified
        if (!user.isVerified) {
            console.log('[LOGIN] User email not verified:', email);
            return res.status(403).json({
                success: false,
                message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
                requiresVerification: true
            });
        }

        // Update Expo push token and backfill referral identity for legacy accounts.
        if ((expoPushToken && expoPushToken !== user.expoPushToken) || !user.referralCode) {
            console.log('[LOGIN] Updating account metadata for:', email);
            if (expoPushToken) user.expoPushToken = expoPushToken;
            if (!user.referralCode) user.referralCode = `GC${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
            await user.save();
        }

        const token = signToken(user._id, user.role);
        console.log('[LOGIN] Sending success response for:', email);

        res.status(200).json({
            success: true,
            token,
            data: { user }
        });
    } catch (error) {
        console.error('[LOGIN] Error during login:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Verification token is required' });
        }

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token. Please request a new one.'
            });
        }

        // Mark user as verified
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now log in to GentsConcerts.'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        console.log('[RESEND_VERIFICATION] Starting for email:', req.body.email);
        const { email } = req.body;

        if (!email) {
            console.log('[RESEND_VERIFICATION] Email is required');
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.log('[RESEND_VERIFICATION] User not found:', email);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            console.log('[RESEND_VERIFICATION] Email already verified:', email);
            return res.status(400).json({ success: false, message: 'Email already verified' });
        }

        // Generate new verification token
        const verificationToken = generateToken();
        const verificationExpires = Date.now() + 24 * 60 * 60 * 1000;

        user.verificationToken = verificationToken;
        user.verificationTokenExpires = verificationExpires;
        await user.save();
        console.log('[RESEND_VERIFICATION] Token updated for:', email);

        // Send email
        try {
            await emailService.sendVerificationEmail(user, verificationToken);
            console.log('[RESEND_VERIFICATION] Sending success response for:', email);
            res.status(200).json({
                success: true,
                message: 'Verification email sent. Please check your inbox.'
            });
        } catch (emailError) {
            console.error('[RESEND_VERIFICATION] Failed to send email to', email, ':', emailError.message);
            res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please check if your email address is correct or try again later.'
            });
        }
    } catch (error) {
        console.error('[RESEND_VERIFICATION] Error:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        console.log('[FORGOT_PASSWORD] Starting for email:', req.body.email);
        const { email } = req.body;

        if (!email) {
            console.log('[FORGOT_PASSWORD] Email is required');
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal whether user exists
            console.log('[FORGOT_PASSWORD] User not found (not revealing):', email);
            return res.status(200).json({
                success: true,
                message: 'If an account exists with that email, a reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = generateToken();
        const resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();
        console.log('[FORGOT_PASSWORD] Reset token generated for:', email);

        // Send email
        try {
            await emailService.sendPasswordResetEmail(user, resetToken);
            console.log('[FORGOT_PASSWORD] Sending success response');
            res.status(200).json({
                success: true,
                message: 'If an account exists with that email, a reset link has been sent.'
            });
        } catch (emailError) {
            console.error('[FORGOT_PASSWORD] Failed to send email to', email, ':', emailError.message);
            // Still return 200 to avoid leaking user existence, but log the error
            res.status(200).json({
                success: true,
                message: 'If an account exists with that email, a reset link has been sent.'
            });
        }
    } catch (error) {
        console.error('[FORGOT_PASSWORD] Error:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ success: false, message: 'Token and new password are required' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token. Please request a new one.'
            });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
