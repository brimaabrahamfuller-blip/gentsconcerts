const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    });
};

exports.register = async (req, res) => {
    try {
        const { fullName, email, phone, password, role } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const newUser = await User.create({
            fullName,
            email,
            phone,
            password,
            role: role || 'attendee'
        });

        const token = signToken(newUser._id, newUser.role);

        res.status(201).json({
            success: true,
            token,
            data: { user: newUser }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Incorrect email or password' });
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

exports.forgotPassword = async (req, res) => {
    res.status(200).json({ success: true, message: 'Password reset email sent (simulated)' });
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
