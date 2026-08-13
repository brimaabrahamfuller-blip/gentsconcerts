const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'You are not logged in' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return res.status(401).json({ success: false, message: 'User no longer exists' });
        }

        // Check if email is verified
        if (!currentUser.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
                requiresVerification: true
            });
        }

        req.user = currentUser;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'You do not have permission' });
        }
        next();
    };
};

// Hosts are marketplace sellers. A role alone is insufficient: the account
// must have been explicitly approved by an administrator before it can manage
// events. Administrators retain access for operational support.
exports.requireApprovedHost = (req, res, next) => {
    if (req.user.role === 'admin' || req.user.role === 'owner') {
        return next();
    }
    if (req.user.role === 'host' && req.user.hostApprovalStatus === 'approved') {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'Host access must be approved by an administrator before you can manage events.'
    });
};
