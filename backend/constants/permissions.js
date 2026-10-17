const DEPARTMENTS = Object.freeze({
    GRC: 'governance_risk_compliance',
    FINANCE: 'finance_payments_settlement',
    OPERATIONS: 'platform_operations_trust',
    TECHNOLOGY: 'technology_security_data'
});

const PERMISSIONS = Object.freeze([
    'admin.portal.access',
    'grc.case.read',
    'grc.case.manage',
    'grc.user-risk.review',
    'grc.complaint.manage',
    'finance.collection.read',
    'finance.reconciliation.manage',
    'finance.refund.manage',
    'finance.payout.create',
    'finance.payout.approve',
    'ops.host.review',
    'ops.event.review',
    'ops.ticket.manage',
    'ops.incident.manage',
    'tech.audit.read',
    'tech.access.manage',
    'tech.incident.manage',
    'owner.override'
]);

const ALL_ADMIN_PERMISSIONS = Object.freeze([...PERMISSIONS]);

module.exports = { DEPARTMENTS, PERMISSIONS, ALL_ADMIN_PERMISSIONS };
