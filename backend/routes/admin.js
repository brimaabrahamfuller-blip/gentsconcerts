const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, requireAdminPortalAccess } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const { requireFinancialStepUp } = require('../middleware/stepUp');

// Protect all routes and require explicit portal access. Owners remain an
// emergency role; ordinary administrators receive department permissions.
router.use(protect);
router.use(requireAdminPortalAccess);

router.get('/stats', requirePermission('admin.portal.access'), adminController.getStats);
router.get('/activity', requirePermission('tech.audit.read'), adminController.getActivityLogs);
router.get('/audit-events', requirePermission('tech.audit.read'), adminController.getAuditEvents);
router.get('/finance/reconciliation', requirePermission('finance.reconciliation.manage'), adminController.getReconciliationSummary);
router.get('/finance/webhooks', requirePermission('tech.audit.read'), adminController.getWebhookEvents);
router.post('/finance/step-up/request', requirePermission('finance.payout.create', 'finance.payout.approve', 'finance.refund.manage'), adminController.requestFinancialStepUp);
router.post('/finance/step-up/verify', requirePermission('finance.payout.create', 'finance.payout.approve', 'finance.refund.manage'), adminController.verifyFinancialStepUp);
router.post('/finance/approvals', requirePermission('finance.payout.create', 'finance.refund.manage'), requireFinancialStepUp, adminController.createFinancialApproval);
router.get('/finance/approvals', requirePermission('finance.payout.approve', 'finance.refund.manage'), adminController.getFinancialApprovals);
router.patch('/finance/approvals/:id/decision', requirePermission('finance.payout.approve', 'finance.refund.manage'), requireFinancialStepUp, adminController.decideFinancialApproval);
router.get('/access/users/:id', requirePermission('tech.access.manage'), adminController.getUserAccess);
router.patch('/access/users/:id', requirePermission('tech.access.manage'), adminController.updateUserAccess);
router.get('/flags', requirePermission('ops.incident.manage'), adminController.getFlags);
router.patch('/flags/:id', requirePermission('ops.incident.manage'), adminController.updateFlag);
router.patch('/users/:id/status', requirePermission('grc.user-risk.review'), adminController.manageUser);
router.get('/host-applications', requirePermission('ops.host.review'), adminController.getPendingHostApplications);
router.patch('/host-applications/:id', requirePermission('ops.host.review'), adminController.reviewHostApplication);
router.get('/event-reviews', requirePermission('ops.event.review'), adminController.getPendingEventReviews);
router.patch('/event-reviews/:id', requirePermission('ops.event.review'), adminController.reviewEventPublication);
router.delete('/events/:id', requirePermission('ops.event.review'), adminController.deleteEvent);
router.get('/users', requirePermission('grc.user-risk.review'), adminController.getAllUsers);
router.delete('/users/:id', requirePermission('grc.user-risk.review'), adminController.deleteUser);
router.get('/tickets', requirePermission('ops.ticket.manage'), adminController.getAllTickets);
router.delete('/tickets/:id', requirePermission('ops.ticket.manage'), adminController.deleteTicket);
router.post('/feedback', requirePermission('ops.incident.manage'), adminController.sendFeedback);

module.exports = router;
