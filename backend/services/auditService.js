const AuditEvent = require('../models/AuditEvent');

exports.recordAuditEvent = async ({
    actor,
    department,
    permission,
    action,
    targetType,
    targetId,
    before,
    after,
    reason,
    requestId,
    outcome = 'success',
    severity = 'info',
    source = 'web_admin_portal'
}) => {
    if (!actor?._id || !actor.role) throw new Error('An authenticated actor is required for audit events.');

    return AuditEvent.create({
        actor: actor._id,
        actorRole: actor.role,
        department,
        permission,
        action,
        targetType,
        targetId,
        before,
        after,
        reason,
        requestId,
        outcome,
        severity,
        source
    });
};
