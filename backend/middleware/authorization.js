const { PERMISSIONS } = require('../constants/permissions');

const hasPermission = (user, permission) => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
};

exports.hasPermission = hasPermission;

exports.requirePermission = (...permissions) => {
    const required = permissions.filter((permission) => PERMISSIONS.includes(permission));
    if (!required.length) throw new Error('Authorization middleware requires at least one valid permission.');

    return (req, res, next) => {
        const granted = required.some((permission) => hasPermission(req.user, permission));
        if (!granted) {
            return res.status(403).json({
                success: false,
                message: 'You do not have the required department permission for this action.',
                requiredPermissions: required
            });
        }
        req.permission = required.find((permission) => hasPermission(req.user, permission));
        next();
    };
};
