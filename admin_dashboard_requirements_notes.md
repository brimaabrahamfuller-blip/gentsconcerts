# GentsConcerts Admin Dashboard Exercise - Key Requirements Notes

Source: `/home/ubuntu/upload/gentsconcerts-admin-dashboard-exercise.pdf`
Reviewed on: 2026-08-15

## Core boundary
- The admin dashboard is a creator-only control plane, not a public dashboard.
- A secret route is useful operationally, but is not real security by itself.
- Real protection should come from strong authentication, server-side authorization, scoped privileges, session controls, rate limiting, and auditability.

## Live inspection findings from the PDF
- Existing admin endpoints exposed in current backend shape include:
  - `/admin/stats`
  - `/admin/users`
  - `/admin/host-applications`
  - `/admin/event-reviews`
  - `/admin/tickets`
  - `/admin/flags`
  - `/admin/activity`
- The PDF notes the deployed admin web shell rendered blank during inspection, while backend admin endpoints were active.

## Required admin command-center structure
The admin home should be an attention-and-decision system, not a vanity dashboard. It should emphasize:
- Critical attention: failed payments, ticket issuance failures, suspicious activity, capacity conflicts, urgent support
- Approval queue: host applications, event reviews, price/capacity changes, payout changes, high-value refunds
- Platform pulse: users, hosts, events, tickets, revenue, check-ins, refunds, disputes, payment health
- Recent activity: actor, role, object, before/after, time, source, correlation ID, outcome
- System health: API, database, auth, payment, webhooks, ticket generation, email/SMS, storage, queues
- Recovery posture: backups, restore tests, incidents, degraded services, runbooks

## User management requirements
- Distinguish fans, hosts, admins, suspended users, unverified users, and users under review.
- Support search by account ID, email, phone, role, verification state, host status, purchase history, and suspicious behavior.
- Sensitive data should be masked by default.
- Admin actions should be domain-specific workflows rather than risky one-click destructive operations.
- Required controls include: view account, suspend account, change role, reset access, export data, delete/anonymize.

## Host application management requirements
- Treat host applications as a review workspace, not just a list.
- Supported statuses should include at least: pending, under review, changes requested, approved, rejected, suspended, expired.
- Decisions should be explicit, versioned, and reasoned.
- Rejected or suspended hosts should receive a suitable reason and support path.

## Event review and publishing control requirements
- Show event preview next to submitted data and policy warnings.
- Reviewer should be able to approve, request changes, reject, pause, or escalate.
- Decisions should include reasons and snapshots.
- Publishing must be controlled; drafting permission must not imply publish permission.

## Tickets / orders / customer protection requirements
- Ticket operations should support timelines, filters, payment status, issuance status, QR status, check-in state, refunds, transfers, retries, and support context.
- Admin actions should be explicit and idempotent.
- Marking used or manual check-in should require reasons and visibility.

## Money / reconciliation requirements
- Revenue must be broken into meaningful categories rather than a single unexplained total.
- Reconciliation should compare ticket totals, payment status, provider amounts, fees, and net revenue.
- Payment-card information should remain outside the application wherever possible.

## Security center and audit trail requirements
- Show login anomalies, failed authorization attempts, unusual exports, privilege changes, suspicious ticket activity, webhook failures, and active incidents.
- Audit trail should capture actor, role, action, object, event, date, source, IP/device context, outcome, and correlation ID.
- Record before/after values for meaningful changes while avoiding unnecessary sensitive data.

## Practical implications for current implementation
- Remove or hide public-facing admin/host affordances that blur role boundaries.
- Separate three experiences clearly:
  1. Fan/User dashboard
  2. Host dashboard for approved event organizers
  3. Creator-only admin command center
- If payments are still beta/manual, the UI must not imply fully live MoMo/PayPal automation. The ticketing flow should communicate beta/manual confirmation honestly.
- The admin dashboard should focus first on queues, reviews, anomalies, and system integrity before broad stats.
- Any remaining creator tools shown in normal profile pages or host surfaces should be removed.
