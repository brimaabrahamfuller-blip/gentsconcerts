const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AdminLoginMfaChallenge = require('../models/AdminLoginMfaChallenge');
const { recordAuditEvent } = require('../services/auditService');
const {
    loadMfaUser,
    startEnrollment,
    confirmEnrollment,
    verifyActiveTotp,
    rotateRecoveryCodes,
    consumeRecoveryCode
} = require('../services/mfaService');

const signToken = (user, method) => jwt.sign(
    { id: user._id, role: user.role, mfaVerified: true, mfaMethod: method },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
);

const audit = async (payload) => {
    try { await recordAuditEvent(payload); } catch (error) { /* audit failure must not expose MFA material */ }
};

const statusFor = (user) => ({
    enabled: Boolean(user.mfaEnabled),
    enrolledAt: user.mfaEnrolledAt || null,
    recoveryCodesAvailable: Array.isArray(user.mfaRecoveryCodeHashes) ? user.mfaRecoveryCodeHashes.length : 0,
    recoveryCodesGeneratedAt: user.mfaRecoveryCodesGeneratedAt || null
});

const publicUser = (user) => {
    const value = user.toObject ? user.toObject() : { ...user };
    delete value.mfaSecretEncrypted;
    delete value.mfaSecretIv;
    delete value.mfaSecretAuthTag;
    delete value.mfaPendingSecretEncrypted;
    delete value.mfaPendingSecretIv;
    delete value.mfaPendingSecretAuthTag;
    delete value.mfaRecoveryCodeHashes;
    return value;
};

exports.status = async (req, res) => {
    const user = await loadMfaUser(req.user._id);
    return res.status(200).json({ success: true, data: statusFor(user) });
};

exports.startEnrollment = async (req, res) => {
    try {
        const user = await loadMfaUser(req.user._id);
        const data = await startEnrollment(user);
        await audit({ actor: req.user, action: 'admin_mfa_enrollment_started', targetType: 'User', targetId: req.user._id, requestId: req.id, outcome: 'pending', severity: 'info' });
        return res.status(201).json({ success: true, data });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

exports.confirmEnrollment = async (req, res) => {
    try {
        const user = await loadMfaUser(req.user._id);
        const recoveryCodes = await confirmEnrollment(user, req.body.code);
        await audit({ actor: req.user, action: 'admin_mfa_enrollment_confirmed', targetType: 'User', targetId: req.user._id, requestId: req.id, after: { enabled: true }, outcome: 'success', severity: 'warning' });
        return res.status(200).json({
            success: true,
            message: 'Administrator MFA enabled. Store these recovery codes securely; they are shown only once.',
            data: { status: statusFor(user), recoveryCodes }
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

exports.rotateRecoveryCodes = async (req, res) => {
    try {
        const user = await loadMfaUser(req.user._id);
        const recoveryCodes = await rotateRecoveryCodes(user, req.body.code);
        await audit({ actor: req.user, action: 'admin_mfa_recovery_rotation', targetType: 'User', targetId: req.user._id, requestId: req.id, after: { recoveryCodesRotated: true }, outcome: 'success', severity: 'warning' });
        return res.status(200).json({ success: true, message: 'Recovery codes rotated. Store them securely; they are shown only once.', data: { recoveryCodes, status: statusFor(user) } });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

exports.verifyLoginMfa = async (req, res) => {
    const challengeId = String(req.body.challengeId || '').trim();
    const code = String(req.body.code || '').trim();
    if (!challengeId || !code) return res.status(400).json({ success: false, message: 'A challenge ID and MFA code are required.' });

    const challenge = await AdminLoginMfaChallenge.findOneAndUpdate(
        { _id: challengeId, status: 'pending', expiresAt: { $gt: new Date() }, $expr: { $lt: ['$attemptCount', '$maxAttempts'] } },
        { $inc: { attemptCount: 1 }, $set: { lastAttemptAt: new Date() } },
        { new: true }
    );
    if (!challenge) {
        const expiredChallenge = await AdminLoginMfaChallenge.findById(challengeId).catch(() => null);
        if (expiredChallenge) {
            const challengedUser = await User.findById(expiredChallenge.userId).catch(() => null);
            if (challengedUser) {
                await audit({ actor: challengedUser, action: 'admin_login_mfa_failure', targetType: 'User', targetId: challengedUser._id, requestId: req.id, outcome: 'failure', severity: 'warning', reason: 'Invalid, expired, or locked MFA challenge.' });
            }
        }
        return res.status(401).json({ success: false, message: 'Invalid, expired, or locked MFA challenge.' });
    }

    const user = await loadMfaUser(challenge.userId);
    if (!user || !user.mfaEnabled) return res.status(401).json({ success: false, message: 'MFA verification is unavailable for this account.' });

    let method = null;
    let valid = false;
    try {
        valid = verifyActiveTotp(user, code);
        if (valid) method = 'totp';
    } catch (error) {
        valid = false;
    }
    if (!valid) {
        valid = await consumeRecoveryCode(user._id, code);
        if (valid) method = 'recovery_code';
    }

    if (!valid) {
        if (challenge.attemptCount >= challenge.maxAttempts) {
            challenge.status = 'locked';
            await challenge.save();
        }
        await audit({ actor: user, action: 'admin_login_mfa_failure', targetType: 'User', targetId: user._id, requestId: req.id, outcome: 'failure', severity: 'warning', reason: 'Invalid MFA verification.' });
        return res.status(401).json({ success: false, message: 'Invalid MFA code or recovery code.' });
    }

    challenge.status = 'verified';
    challenge.verifiedAt = new Date();
    await challenge.save();
    await User.updateOne({ _id: user._id }, { $set: { mfaLastUsedAt: new Date() } });
    await audit({ actor: user, action: 'admin_login_mfa_success', targetType: 'User', targetId: user._id, requestId: req.id, after: { method }, outcome: 'success', severity: 'info' });
    return res.status(200).json({ success: true, token: signToken(user, method), data: { user: publicUser(user), mfaMethod: method } });
};

exports.consumeRecoveryCode = async (req, res) => {
    const challengeId = String(req.body.challengeId || '').trim();
    const code = String(req.body.code || '').trim();
    if (!challengeId || !code) return res.status(400).json({ success: false, message: 'A challenge ID and recovery code are required.' });
    req.body.code = code;
    return exports.verifyLoginMfa(req, res);
};
