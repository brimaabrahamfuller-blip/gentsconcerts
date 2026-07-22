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
        const { fullName, email, phone, password, role, expoPushToken } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        // Generate email verification token
        const verificationToken = generateToken();
        const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        const newUser = await User.create({
            fullName,
            email,
            phone,
            password,
            role: role || 'attendee',
            verificationToken,
            verificationTokenExpires: verificationExpires,
            isVerified: false,
            expoPushToken: expoPushToken || null
        });

        // Send verification email (non-blocking, don't await to avoid slowing response)
        try {
            await emailService.sendVerificationEmail(newUser, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError.message);
        }

        // Auto-login after registration (token returned for convenience)
        const token = signToken(newUser._id, newUser.role);

        res.status(201).json({
            success: true,
            token,
            message: 'Account created. Please check your email to verify your account.',
            data: { user: newUser }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, expoPushToken } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Incorrect email or password' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
                requiresVerification: true
            });
        }

        // Update Expo push token if provided
        if (expoPushToken && expoPushToken !== user.expoPushToken) {
            user.expoPushToken = expoPushToken;
            await user.save();
        }

        const token = signToken(user._id, user.role);

        res.status(200).json({
            success: true,
            token,
            data: { user }
        });
    } catch (error) {
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
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Email already verified' });
        }

        // Generate new verification token
        const verificationToken = generateToken();
        const verificationExpires = Date.now() + 24 * 60 * 60 * 1000;

        user.verificationToken = verificationToken;
        user.verificationTokenExpires = verificationExpires;
        await user.save();

        await emailService.sendVerificationEmail(user, verificationToken);

        res.status(200).json({
            success: true,
            message: 'Verification email sent. Please check your inbox.'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal whether user exists
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

        await emailService.sendPasswordResetEmail(user, resetToken);

        res.status(200).json({
            success: true,
            message: 'If an account exists with that email, a reset link has been sent.'
        });
    } catch (error) {
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
