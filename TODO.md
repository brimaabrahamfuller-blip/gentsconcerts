# GentsConcerts Control-Plane TODO

## Permission and department foundation

- [x] Users can carry explicit department memberships and permissions for Governance/Risk/Compliance, Finance/Payments/Settlement, Platform Operations/Trust & Safety, and Technology/Security/Data.
- [x] Backend admin routes enforce permissions server-side instead of relying on a hard-coded administrator email.
- [x] Owner access remains available as an explicit emergency role, with audit coverage.

## Audit and retention

- [x] Privileged actions write structured audit events containing actor, target, before/after state, source, outcome, and timestamp.
- [x] Populate department, permission, and request-correlation fields from request context on every privileged action.
- [x] Provide a read-only paginated audit-event endpoint for technology/audit reviewers.
- [x] Provide a validated department/permission assignment endpoint with owner safeguards and approval limits.
- [x] Admin user deletion becomes retention-preserving deactivation/anonymization behavior.
- [x] Admin ticket deletion becomes a retained operational void state rather than physical deletion.

## Payment safety

- [x] Production payment configuration fails closed when required MTN settings are absent.
- [x] Collections and Disbursements remain separate integration concerns.
- [x] No live Disbursements submission is enabled in this increment.
- [x] MTN Collections have durable payment-attempt records with idempotency keys, provider references, retry state, and callback status.
- [x] Successful paid ticket collections post balanced append-only LRD ledger entries exactly once.
- [x] Legacy standalone MTN initiation is retired so payment requests cannot bypass ticket and ledger controls.
- [x] Finance has a permissioned read-only reconciliation summary endpoint.
- [x] Persist MTN callback deliveries with deduplication, retryable failure status, payload hash, request ID, and audit-review access.
- [ ] Add provider callback signature/authenticity verification beyond the current shared callback token, if MTN Liberia provides a signed-webhook mechanism.
- [x] Add a read-only reconciliation screen for Finance.
- [ ] Add an exportable exception report for Finance.
- [x] Add dry-run-first migration/reconciliation handling for legacy transactions created before PaymentAttempt and LedgerEntry records.
- [ ] Run the reconciliation dry run against the configured production database and obtain Finance approval before any `--apply` execution.

## Admin control-plane interface

- [x] The admin portal provides a dedicated Department access view for selecting administrators, assigning departments, assigning validated permissions, and setting LRD payout/refund approval limits.
- [x] The admin portal provides an Audit review view with action filtering, actor/target context, request IDs, timestamps, and outcomes.
- [x] The interface is registered in navigation, linked from the existing admin menu, and adapts between wide web layouts and compact mobile layouts.
- [ ] Add a dedicated backend-driven permission summary/empty-state for accounts that lack `tech.access.manage`, rather than relying only on the generic authorization response.

## Validation and delivery

- [x] Backend syntax and available project checks pass.
- [x] The commit is authored with the configured GitHub identity.
- [x] The focused change is pushed to the selected GentsConcerts repository.
