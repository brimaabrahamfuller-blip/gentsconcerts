# GentsConcerts Admin Dashboard Exercise (3) - Key Findings

Source: `/home/ubuntu/upload/gentsconcerts-admin-dashboard-exercise(3).pdf`

## 1. Security boundary
- The admin dashboard must remain a **creator-only control plane**, not a public dashboard.
- A hidden route is only obscurity, **not security**.
- Required hardening includes: strong auth, server-side authorization, MFA, scoped privileges, rate limiting, session controls, step-up verification for dangerous actions, and immutable audit evidence.

## 2. Live inspection findings from report
- Report observed live backend domains/endpoints for:
  - `/admin/stats`
  - `/admin/users`
  - `/admin/host-applications`
  - `/admin/event-reviews`
  - `/admin/tickets`
  - `/admin/flags`
  - `/admin/activity`
- Direct backend inspection reportedly found:
  - 2 active events
  - 11 users
  - 5 host applications
  - 11 tickets
  - 0 revenue
  - 0 pending flags
  - 0 event reviews
  - empty activity/feed data
- Visible admin portal reportedly showed zeros for hosts, event reviews, incidents, failed payments, total tickets, confirmed tickets, hosts, and new users in the last 24 hours.
- Main trust issue flagged by report: **backend data and visible dashboard data are not reconciled reliably**.
- Dashboard needs:
  - last-synced timestamps
  - query diagnostics
  - explicit loading/error states
  - reconciliation indicators

## 3. Ruthless standard / command-center expectation
The dashboard must not be an executive vanity board. It should answer:
- what is blocked
- what is financially dangerous
- which host applications are waiting
- which events need review
- whether tickets are being issued correctly
- whether any integration is failing

Required command-center areas:
- **Critical attention**: failed payments, ticket issuance failures, suspicious activity, capacity conflicts, urgent support cases
- **Approval queue**: host applications, event reviews, price/capacity changes, payout changes, high-value refunds
- **Platform pulse**: users, hosts, events, tickets, revenue, check-ins, refunds, disputes, payment health
- **Recent activity**: actor, role, target object, before/after, time, source, correlation ID, outcome
- **System health**: API, database, auth, payment, webhooks, ticket generation, email/SMS, storage, queues
- **Recovery posture**: last backup, last restore test, active incidents, degraded services, runbook links

Every attention item should include:
- owner
- severity
- source
- created time
- due time
- status
- next action

## 4. Hidden portal and login design
- Keep secret route if useful, but do not expose privileged portal logic in public bundles or obvious routes.
- Login should require email + password and ideally MFA for admin accounts.
- Use secure httpOnly sessions or short-lived access tokens with rotation.
- Add rate limits, suspicious-login detection, session listing/revocation, activity timeout.
- Destructive or high-risk actions should require step-up authentication.
- Never reveal whether an email is a valid admin account in password-reset flows.
- Record successful/failed logins, auth failures, session changes, privilege changes, exports, and high-risk actions.

## 5. Users module requirements
- Distinguish: fans, hosts, admins, suspended users, unverified users, users under review.
- Support search by: account ID, email, phone, role, verification state, host status, purchase history, suspicious behavior.
- User record should show identity, verification, roles, host application state, tickets/orders, support cases, sessions/devices, security events, and audit history.
- Sensitive fields should be masked by default.
- Admins should not casually edit financial records or ticket ownership from the user profile.

Required controls table from report:
- View account -> scope check, masked personal data, access log
- Suspend account -> reason, duration, impact preview, notification, reversible status
- Change role -> approval, step-up auth, audit event, session invalidation where needed
- Reset access -> verified process, never reveal secrets/passwords
- Export data -> purpose, scope, masking, expiry, audit record
- Delete/anonymize -> retention policy, legal/financial dependency check, evidence preservation

## 6. Host applications and host management
- Should be a **review workspace**, not just a list of names.
- Each application needs:
  - completeness score
  - submitted materials
  - verification signals
  - event history
  - risk flags
  - reviewer notes
  - requested changes
  - decision
  - decision reason
  - next action
- Supported statuses should include at minimum:
  - pending
  - under review
  - changes requested
  - approved
  - rejected
  - suspended
  - expired
- Approval should be explicit and versioned.
- Rejected/suspended hosts should receive reason + appeal/support path.
- Current backend foundation is considered decent, but frontend must show what each application needs and why it is blocked.

## 7. Event reviews and publishing control
- Event review queue should show event preview exactly as a fan sees it, next to submitted data and policy warnings.
- Reviewer actions should include:
  - approve
  - request changes
  - reject
  - pause
  - escalate
- Every decision must include a reason and snapshot.
- Review high-risk event characteristics such as:
  - venue capacity
  - age restrictions
  - unclear pricing
  - missing refund policy
  - suspicious organizer behavior
  - prohibited content
  - incomplete artist/venue details
  - abrupt changes after tickets sell
- Publishing must show before/after differences, fan impact, inventory impact, communication requirement, and rollback/reversal options.

## 8. Tickets, orders, and customer protection
- Ticket module should support:
  - order timelines
  - event/tier filters
  - payment status
  - ticket issuance status
  - QR status
  - check-in state
  - refunds
  - transfers
  - retries
  - support context
- Live endpoint reportedly exposes useful fields already: payment status, tier, quantity, purchaser fields, QR code, used state, financial transaction references.
- Admin actions should be explicit and idempotent.
- Required examples:
  - Retry ticket -> safe regeneration
  - Refund -> show amount, policy, payment ref, ticket state, customer impact before confirm
  - Mark used / manual check-in -> require reason and visible ops timeline
- No admin action should silently edit a ticket record without a timeline entry.

## 9. Money, revenue, and reconciliation
- Zero revenue with existing tickets is not automatically a defect, but it is a reconciliation warning.
- Dashboard should relate: ticket totals, payment status, order totals, confirmed provider amounts, refunds, fees, and net revenue.
- Finance view should separate:
  - gross sales
  - discounts
  - taxes
  - platform fees
  - host share
  - refunds
  - disputes
  - reserves
  - payout status
- Revenue numbers must be defined and reconciled to trusted ledger/provider data.
- Card information should remain outside app storage where possible; hosted/tokenized payment collection is preferred.

## Immediate implementation priorities derived from the report
1. Fix live/backend vs dashboard-visible data mismatch with explicit reconciliation and sync timestamps.
2. Make admin home truly action-oriented: critical attention, approval queue, pulse, activity, health, recovery.
3. Upgrade user module beyond simple list/delete.
4. Upgrade host review flow to real workspace with statuses, reasoned decisions, and reviewer notes.
5. Upgrade event review flow to include decision reasons and policy context.
6. Upgrade tickets workspace to timeline/action model, not only delete.
7. Add better explicit loading, empty, and error states across admin views.
8. Reduce/replace vanity metrics with operational metrics that match the report.
9. Preserve beta payment language while showing reconciliation warnings honestly.
10. Keep hidden route, but continue improving true access control and admin auditability.

## Constraints from user comments to preserve
- Focus on the **Admin / creator dashboard first**.
- Remove public/host-style affordances from admin experiences.
- Keep payment flow honest about **free beta ticketing** while MoMo/PayPal legal setup is pending.
- Changes should push under Brima Abraham Fuller identity.
- Must work against the real site/database, not mock navigation-only shells.

## Most likely already-known blocker to verify during implementation
- Secret admin route historically pointed to the wrong screen (`AdminScreen` instead of `OwnerDashboardScreen`), so implementation must verify routing and deployment after changes.
- Dashboard action buttons need both frontend rendering fixes and backend payload compatibility checks.

## Recommended next code focus
- `gentsconcerts-app/screens/OwnerDashboardScreen.js`
- `gentsconcerts-app/screens/AdminScreen.js`
- `gentsconcerts-app/screens/SplashScreen.js`
- `gentsconcerts-app/screens/LoginScreen.js`
- `backend/controllers/adminController.js`
- `backend/routes/admin.js`
- related models for activity, flags, tickets, host statuses

## Evidence note
This notes file summarizes visual findings from the PDF view and should be used as the operational checklist for the next implementation pass.

