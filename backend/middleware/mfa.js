const isAdministrativeAccount = (user) => ['admin', 'owner'].includes(user?.role);

exports.requireAdminAccount = (req, res, next) => {
    if (isAdministrativeAccount(req.user)) return next();
    return res.status(403).json({ success: false, message: 'Administrator access is required.' });
};

exports.requireAdminMfaEnrolled = (req, res, next) => {
    if (!isAdministrativeAccount(req.user)) {
        return res.status(403).json({ success: false, message: 'Administrator access is required.' });
    }
    if (req.user.mfaEnabled) return next();
    return res.status(428).json({
        success: false,
        code: 'MFA_SETUP_REQUIRED',
        message: 'Administrator MFA enrollment is required before accessing this area.',
        mfaSetupRequired: true
    });
};

exports.requireStrongMfa = (req, res, next) => {
    if (isAdministrativeAccount(req.user) && req.auth?.mfaVerified === true) return next();
    if (isAdministrativeAccount(req.user) && req.emailStepUpValidated === true) return next();
    return res.status(428).json({
        success: false,
        code: 'MFA_REQUIRED',
        message: 'A successful administrator authenticator verification is required for this action.'
    });
};
