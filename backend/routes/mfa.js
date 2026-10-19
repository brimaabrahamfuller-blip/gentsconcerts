const express = require('express');
const router = express.Router();
const mfaController = require('../controllers/mfaController');
const { protect } = require('../middleware/auth');
const { requireAdminAccount } = require('../middleware/mfa');

const adminMfa = [protect, requireAdminAccount];

router.get('/admin/mfa/status', ...adminMfa, mfaController.status);
router.post('/admin/mfa/enrollment/start', ...adminMfa, mfaController.startEnrollment);
router.post('/admin/mfa/enrollment/confirm', ...adminMfa, mfaController.confirmEnrollment);
router.post('/admin/mfa/recovery-codes/rotate', ...adminMfa, mfaController.rotateRecoveryCodes);
router.post('/admin/mfa/login/verify', mfaController.verifyLoginMfa);
router.post('/admin/mfa/recovery-codes/consume', mfaController.consumeRecoveryCode);

router.get('/mfa/status', ...adminMfa, mfaController.status);
router.post('/mfa/enrollment/start', ...adminMfa, mfaController.startEnrollment);
router.post('/mfa/enrollment/confirm', ...adminMfa, mfaController.confirmEnrollment);
router.post('/mfa/recovery-codes/rotate', ...adminMfa, mfaController.rotateRecoveryCodes);
router.post('/mfa/login/verify', mfaController.verifyLoginMfa);
router.post('/mfa/recovery-codes/consume', mfaController.consumeRecoveryCode);

module.exports = router;
