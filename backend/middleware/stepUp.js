const { requireGrant } = require('../services/stepUpService');

exports.requireFinancialStepUp = async (req, res, next) => {
    try {
        if (req.auth?.mfaVerified !== true && process.env.ALLOW_EMAIL_STEP_UP_FALLBACK !== 'true') {
            return res.status(428).json({
                success: false,
                code: 'MFA_REQUIRED',
                message: 'A successful administrator authenticator verification is required before financial step-up.'
            });
        }
        const grant = await requireGrant({
            userId: req.user._id,
            purpose: 'financial_approval',
            grantToken: req.get('x-step-up-token')
        });
        req.stepUpChallenge = grant;
        if (req.auth?.mfaVerified !== true) req.emailStepUpValidated = true;
        next();
    } catch (error) {
        res.status(428).json({
            success: false,
            code: 'STEP_UP_REQUIRED',
            message: error.message
        });
    }
};
