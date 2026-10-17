# GentsConcerts Control-Plane TODO

## Permission and department foundation

- [x] Users can carry explicit department memberships and permissions for Governance/Risk/Compliance, Finance/Payments/Settlement, Platform Operations/Trust & Safety, and Technology/Security/Data.
- [x] Backend admin routes enforce permissions server-side instead of relying on a hard-coded administrator email.
- [x] Owner access remains available as an explicit emergency role, with audit coverage.

## Audit and retention

- [x] Privileged actions write structured audit events containing actor, target, before/after state, source, outcome, and timestamp.
- [ ] Populate department, permission, and request-correlation fields from request context on every privileged action.
- [x] Admin user deletion becomes retention-preserving deactivation/anonymization behavior.
- [x] Admin ticket deletion becomes a retained operational void state rather than physical deletion.

## Payment safety

- [x] Production payment configuration fails closed when required MTN settings are absent.
- [x] Collections and Disbursements remain separate integration concerns.
- [x] No live Disbursements submission is enabled in this increment.

## Validation and delivery

- [x] Backend syntax and available project checks pass.
- [x] The commit is authored with the configured GitHub identity.
- [ ] The focused change is pushed to the selected GentsConcerts repository.
