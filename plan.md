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

## Financial-control increment

The ticket payment flow now creates a `PaymentAttempt` record with a client/server idempotency key, provider reference, provider status, retry number, safe request context, and completion/failure timestamps. Existing `Transaction` and `Ticket` records link to the attempt. Successful paid Collections post two append-only LRD `LedgerEntry` records: a debit to `mtn_clearing` and a credit to `ticket_sales_revenue`. The posting group is unique and replay-safe, so a repeated MTN callback cannot create a second financial posting.

The legacy standalone payment-initiation endpoint now returns a retirement response rather than bypassing ticket, attempt, and ledger controls. Finance can read a permissioned reconciliation summary through the admin API and the control-plane UI. This is still a Collections foundation, not a settlement or Disbursements implementation. Provider-specific callback authenticity, dead-letter handling, legacy-data migration, and an exportable exception report remain open.

The admin control-plane now includes a read-only Finance tab showing pending attempts, posted LRD ledger totals, provider references, and failure/status information. It handles missing Finance permission with an explicit access state rather than exposing financial data.

MTN callback deliveries are now persisted in `WebhookEvent` records keyed by provider operation and reference. Duplicate processed/deferred callbacks return safely without re-running payment confirmation. Failed deliveries remain visible with attempt counts, request IDs, payload hashes, and error messages so they can be retried and investigated. This does not claim provider-level cryptographic signature verification; that remains dependent on MTN Liberia's documented webhook capabilities.

Legacy transactions can now be assessed and, only after explicit operator choice, linked to `PaymentAttempt` records through `npm run finance:reconcile-legacy`. The command is dry-run by default. `--apply` creates legacy attempt links and posts a collection ledger only when the old transaction is completed, has a positive amount, and contains an MTN provider reference. Completed records without a provider reference are reported as manual-review exceptions rather than being treated as settled automatically.

Maker-checker financial approvals are now available through the admin API. A requester must have the relevant create permission and approval limit; a different authorized reviewer must approve or reject before expiry. Each request and decision is audited with actor, permission, request ID, reason, and timestamps. Approval decisions explicitly return `executionEnabled: false`: they do not initiate a payout, refund, or MTN Disbursement. MFA/step-up authentication and the eventual execution/release layer remain separate gates.

Financial approval creation and decision routes now require a single-use email step-up grant. The flow is: request a challenge, receive a six-digit code by email, verify the code, then send the returned grant token once with the intended approval request or decision. Codes expire after ten minutes, are limited to five attempts, are hashed at rest, and grants are consumed atomically. This is an email step-up control, not yet phishing-resistant MFA such as TOTP or WebAuthn.

Stage D reconciliation now has a read-only exception report at `GET /api/admin/finance/reconciliation/exceptions`, with JSON output by default and CSV output using `?format=csv`. It identifies missing payment-attempt links, completed transactions without provider references, successful payments missing ledger postings, stale attempts, and unbalanced LRD posting groups. The ledger service also supports verified-reference-only refund and reversal postings. These create balanced two-line append-only groups, enforce remaining-balance limits, and return safely on duplicate idempotency replays. The endpoint records only provider-confirmed adjustments; it does not call an MTN refund or Disbursement API.

Provider confirmations now enter a durable `ReconciliationCase` queue through `POST /api/admin/finance/reconciliation/provider-confirmations`. Cases remain open until an independent Finance reviewer marks them `approved_for_ledger`, `rejected`, or `needs_info`. The adjustment endpoint requires a matching approved case and marks it `posted` only after the append-only ledger group succeeds. Ingestion and review require administrator MFA plus a single-use financial step-up grant. No provider refund, payout, or Disbursement call is made.

The remaining Stage D foundation is now combined in draft-only settlement controls. `SettlementBatch` records carry a past cutoff, ledger watermark, gross Collections, refunds/reversals, platform fees from recorded transaction commission values, host payables from recorded host-payout values, unallocated net amounts, and item-level exceptions. Finance can create a draft, inspect batches, and independently compare provider settlement totals. A provider mismatch is retained as a critical review state. There is still no release, payout, settlement execution, or MTN Disbursement call.
