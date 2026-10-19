const { requireGrant } = require('../services/stepUpService');

exports.requireFinancialStepUp = async (req, res, next) => {
    try {
        const grant = await requireGrant({
            userId: req.user._id,
            purpose: 'financial_approval',
            grantToken: req.get('x-step-up-token')
        });
        req.stepUpChallenge = grant;
        next();
    } catch (error) {
        res.status(428).json({
            success: false,
            code: 'STEP_UP_REQUIRED',
            message: error.message
        });
    }
};
