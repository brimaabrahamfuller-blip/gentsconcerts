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

## Admin control-plane interface

The existing admin portal now exposes a dedicated `AdminControlPlaneScreen` registered in `gentsconcerts-app/navigation/RootNavigator.js` and linked from `AdminScreen`. The interface has two focused views: **Department access** for selecting an administrator, assigning department memberships, assigning validated permissions, and setting LRD approval limits; and **Audit review** for filtering and reviewing retained privileged actions.

The chosen design is an operational dark console: navy surfaces establish a serious control-room context, gold marks decisions and active controls, and red remains reserved for risk/exception emphasis. The layout uses a split staff rail and access editor on wide screens, then collapses into a stacked mobile flow. Interaction is explicit and reversible: select an administrator, change chips or permission checkboxes, review limits, then save one audited assignment. Payment credentials and live disbursement actions are not exposed in this interface.

Frontend structure:

- `screens/AdminControlPlaneScreen.js` owns control-plane data loading, access editing, audit filtering, and responsive presentation.
- `navigation/RootNavigator.js` registers the protected screen.
- `screens/AdminScreen.js` provides the portal entry point.
- Backend endpoints remain the authorization boundary; the UI never treats a hidden button as a security control.
