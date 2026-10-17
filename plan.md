# GentsConcerts Control-Plane Increment

## Goal

Implement the first safe foundation for the four-department administration model without enabling production MTN Disbursements yet.

## Scope

- Replace hard-coded administrator email authorization with explicit server-side permissions.
- Add department and permission assignments to users.
- Add an append-only audit-event model and service.
- Convert admin user/ticket deletion into retention-preserving deactivation/voiding.
- Add production payment configuration guards.
- Preserve the current frontend contract where possible so the existing portal keeps working.
- Keep Collections and Disbursements separate; do not add a payout execution path in this increment.

## Architecture

- `backend/constants/permissions.js`: canonical department and permission vocabulary.
- `backend/middleware/authorization.js`: permission checks for protected routes.
- `backend/models/AuditEvent.js`: structured audit evidence.
- `backend/services/auditService.js`: best-effort audit writer with request correlation.
- `backend/models/User.js`: department memberships, permissions, approval limits, deactivation metadata.
- `backend/routes/admin.js`: permission-scoped administrative routes.
- `backend/controllers/adminController.js`: audit-backed, retention-preserving actions.
- `backend/services/mtnMomo.js` and `backend/controllers/ticketController.js`: explicit production payment guards only.

## Design

**Style options:** operational dark console (0.04), document-led compliance workspace (0.03), bright consumer dashboard (0.02). Choose operational dark console, reusing the existing GentsConcerts navy/gold/red visual language.

The control plane will prefer clear status, owner, next action, evidence, and approval boundaries over decorative dashboard elements. Department screens can be added after the backend permission and audit foundation is deployed.

## Delivery boundary

This increment does not claim regulatory approval, does not alter historical Git authorship, and does not turn on live payment or disbursement activity. It creates the technical controls needed for the next implementation phase.
