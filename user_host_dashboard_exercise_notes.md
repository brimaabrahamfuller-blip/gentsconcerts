# GentsConcerts User and Host Dashboard Exercises - Working Notes

## Source 1
`/home/ubuntu/upload/gentsconcerts-user-dashboard-exercise.pdf`

## User Dashboard - Key findings

The user dashboard is defined as the **fan's trusted place** to discover shows, buy tickets, retrieve valid admission credentials, manage changes, and obtain support without needing to understand the platform's internal machinery. The report stresses that the current ticketing experience is intended to operate as a **free beta** while GentsConcerts completes legal documentation and prepares future MoMo merchandise and PayPal integrations. The first requirement is therefore not feature inflation but restoring a reliable public journey on desktop and mobile.

The required quality bar is that the dashboard must feel **fast, reassuring, transparent, and difficult to misuse**. A fan should never need to guess whether a payment succeeded, whether a QR code is still valid, whether a ticket is real, or whether an event has been cancelled.

The primary navigation must cover these areas with clear fan goals and operational behavior:

| Area | Fan goal | Required behavior |
| --- | --- | --- |
| Discover | Find relevant concerts | Search, filters, location, date, genre, price, availability, featured events |
| Event details | Decide whether to attend | Flyer, artist, venue, date/time, tiers, fees, refund policy, accessibility notes, organizer identity |
| Checkout | Buy securely | Ticket selection, inventory reservation, fee/tax breakdown, payment state, consent, confirmation |
| My Tickets | Prove admission | Ticket cards, QR code, event status, attendee name, tier, validity, restrictions |
| Orders | Understand money | Order history, receipts, payment state, refund status, support request |
| Profile | Keep identity accurate | Name, phone, email verification, password, notification preferences, trusted devices |
| Help | Resolve problems | Payment retry, ticket delivery retry, refund request, event-change notices, human escalation |

The dashboard home should prioritize the **next useful action**. A signed-in fan should see upcoming tickets first, followed by recommended or nearby events, unresolved payment or ticket issues, and then a compact account summary. Empty vanity analytics are explicitly discouraged.

The home screen should include the following guidance:

| Component | Example content |
| --- | --- |
| Upcoming ticket hero | A ticket-ready event with immediate QR access |
| Action strip | View ticket, download, add to calendar, get directions, contact support |
| Purchase state alert | Clear wording such as payment awaiting confirmation; discourage duplicate purchase |
| Discover section | Events filtered by location, date, interest, availability |
| Account protection | Email verified, MFA/phone status, recent login devices |

The signup flow should ask only for data necessary to create and support a ticket: name, email, phone where operationally required, password or supported identity provider, and consent choices. Verification should be clear and recoverable. Login should support password reset, rate limiting, suspicious-login alerts, session revocation, and a visible distinction between attendee and host application. A fan must never accidentally enter a privileged host or admin experience just because roles exist in the same backend.

Event cards must display the minimum decision-making information: title, date, venue, city, starting price, ticket availability, and a meaningful event image. Event detail should clearly present ticket price, service fees, taxes if applicable, currency, quantity limits, refund policy, ticket transfer rules, and whether the ticket is pending or immediately issued.

The report specifically states that because GentsConcerts is deliberately running a **free-beta ticketing phase**, zero-valued beta tickets may be valid and should be labeled clearly as **Beta ticket — no payment required**. The system must distinguish intentional free-beta orders from broken pricing configuration. Future MoMo and PayPal integration should fit into provider-specific payment states without redesigning the fan-facing journey.

Checkout must behave as a **state machine**, not a single success screen. At minimum it should represent cart created, inventory reserved, payment initiated, payment pending, payment confirmed, ticket issued, payment failed, payment reversed, refund pending, refunded, and support review. During beta, ticket confirmation may use a controlled issuance path, but the order still needs a clear user-visible state such as **Beta confirmed**, **Ticket processing**, or **Support review**. Users must be discouraged from buying again while a payment is pending, and repeated taps must never create duplicate orders.

The failure-handling guidance includes these examples:

| Failure scenario | Fan-facing response |
| --- | --- |
| Beta ticket issued | Label order as free-beta and issue ticket without implying payment |
| Payment declined after launch | Explain no ticket was issued; offer retry without duplicating order |
| Payment pending after launch | Show pending state and polling/notification path; discourage repurchase |
| Payment succeeded, ticket delayed | Show order confirmed, ticket processing, and retry/download support |
| Network lost after payment | Let fan return to order status; never assume failure from timeout |
| Event sold out during checkout | Release reservation and explain result; offer waitlist/notification |
| Event postponed | Clearly mark ticket status, options, deadline, and organizer notice |

The **My Tickets** area should be the most dependable feature in the account. Each ticket must show event, date/time, venue, attendee, tier, order reference, QR code or scannable credential, current status, and explicit validity. The report says the current app concepts—downloadable ticket PDF, retry ticket generation, pending state, and used state—should be retained but improved with clearer explanations and server-authoritative status.

The ticket screen should support one-handed mobile use, high contrast, screen-reader labels, offline-friendly display where safe, and a backup identifier for gate staff. If a ticket is used, the dashboard may show when and where it was checked in only when appropriate. Raw secret values must never be exposed, and screenshots should not be treated as authoritative without backend validation.

Orders and support should be contextual. Every order needs a timeline explaining what was bought, how much was paid, which payment method or provider reference was used in masked form, what was issued, and what changed afterward. Fans should be able to ask for help on payment issues, missing tickets, wrong attendee details, transfer requests, refund requests, or event cancellation without having to retype order numbers.

Accessibility requirements use WCAG 2.2 AA as the baseline. The design should prioritize the QR credential, event date, venue, and support action while reducing clutter on mobile.

Security and trust require object-level ownership checks server-side. A fan may be authenticated yet still must be prevented from viewing another person's order or ticket. Access-control decisions should be enforced on the backend, not implied by the interface alone.

## Immediate User Dashboard implementation priorities

| Priority | Requirement |
| --- | --- |
| 1 | Repair the public fan journey so it works reliably on desktop and mobile |
| 2 | Make ticket and checkout states explicit, especially beta/free issuance states |
| 3 | Make My Tickets the strongest, most reliable area with QR, status, validity, and support actions |
| 4 | Add order timelines and contextual support flows |
| 5 | Keep fan and host/admin experiences strictly separated |
| 6 | Preserve beta payment honesty while preparing for MoMo/PayPal later |

## Pending next source
The host dashboard exercise still needs to be reviewed and added below.


## Source 2
`/home/ubuntu/upload/gentsconcerts-host-dashboard-exercise.pdf`

## Host Dashboard - Key findings

The host dashboard is described as the **operator console for approved event organizers**, not a public social profile and not an admin back office. Its purpose is to help a trusted host create compliant events, submit them for review, track sales and attendance, manage customer-impacting changes safely, and communicate with fans within permitted controls. The report explicitly separates **application-to-become-host**, **host approval**, and **post-approval operations**. A person should not see the full host workspace until the admin team approves the application.

The correct host lifecycle is therefore staged. An attendee may request host access. While pending, the dashboard should behave like a status workspace showing what was submitted, what is missing, what the admins are reviewing, and what the next step is. Once approved, the interface expands into operational tools. If rejected or changes are requested, the host must see the reason and a route to correct the application rather than a broken or empty dashboard.

The report requires the host dashboard to answer five recurring questions: **What events am I running, what needs action now, how are tickets performing, what changed, and what risks could hurt fans or revenue?** The design should prefer event operations and exception handling over generic vanity summaries.

The main host workspace should contain the following pillars:

| Host area | Operational goal | Required behavior |
| --- | --- | --- |
| Application status | Understand approval state | Pending, under review, changes requested, approved, rejected, suspended |
| Event workspace | Create and edit event drafts | Structured event editor, pricing tiers, capacity, media, policy fields |
| Review pipeline | Submit for admin approval | Submission checklist, policy validation, diff tracking, review notes |
| Sales and attendance | Understand performance | Orders, issued tickets, confirmed payments, usage/check-ins, refunds/cancellations |
| Communications | Protect fan trust | Announcements for schedule, venue, policy, or cancellation changes |
| Financial visibility | Understand beta vs paid states | Clear distinction between beta/free tickets and future paid-provider flows |
| Support and compliance | Resolve issues safely | Ticket issues, suspicious orders, customer support context, event policy checks |

The report says the host home must foreground **events requiring attention**. Useful examples include pending review submissions, incomplete required fields, low inventory, suspicious order patterns, failed ticket issuance, event-date conflicts, venue-capacity mismatches, and pending customer-impacting changes. A host should not be greeted primarily by decorative statistics.

The event creation flow must be structured and policy-aware. Required fields include title, description, category, date, time, venue, city, country, ticket tiers, pricing, quantity, flyer, and any applicable rules such as age limits or refund policies. The report recommends a draft-first workflow: save draft, validate, preview as fan sees it, submit for review, track admin decision, and revise safely.

The host experience must distinguish these event states clearly:

| State | Meaning |
| --- | --- |
| Draft | Private work in progress |
| Needs info | Missing required fields or failed validation |
| Pending review | Submitted and awaiting admin decision |
| Changes requested | Admin asked for specific fixes |
| Approved / scheduled for publish | Cleared for catalogue availability |
| Published | Visible to fans and eligible for ticketing |
| Paused | Temporarily hidden or sales affected |
| Rejected | Not allowed to publish in current form |
| Cancelled | No longer active; fan communication required |

The host review area should show **why** an event is blocked, not just that it is blocked. It should surface policy warnings, missing assets, pricing inconsistencies, venue/capacity concerns, and admin notes. A host should never have to guess which field caused rejection.

The sales module must be grounded in operational truth. Hosts should see the relationship between inventory, ticket issuance, order counts, payment states, confirmed admissions, and customer-impacting exceptions. The report emphasizes that while GentsConcerts is still in a **free beta ticketing** phase, the dashboard must be honest about that. Hosts should understand which tickets are beta/free, which are pending external payment confirmation in future-ready models, and which require admin support. Beta should never be mislabeled as settled commercial revenue.

The required host metrics are decision-oriented rather than vanity-oriented. The important numbers include total issued tickets, confirmed orders, pending orders, failed issuance, used/check-ins, remaining inventory, refund requests, and unresolved support issues. Revenue should only be shown when grounded in trustworthy payment-state logic and should separate gross, fees, refunds, and any host-share concepts when those become real.

Host communications are tightly controlled. The report expects the ability to notify attendees about important event changes such as venue change, time change, postponement, cancellation, access instructions, or ticketing issues. However, communications should be templated, auditable, and limited to legitimate event operations rather than free-form spam.

The media and upload path must be treated as a serious host feature. Flyer uploads, promotional assets, and any supporting files should show upload progress, validation, allowed formats, error states, and preview. A broken upload feature undermines both event creation and review. The report therefore treats media reliability as a first-order requirement, not a cosmetic extra.

For host support and risk controls, the dashboard should make it obvious when an order is suspicious, when a ticket duplication risk exists, when a sales state is inconsistent, or when support escalation is needed. Hosts should be informed, but some actions must remain admin-only. The host dashboard must therefore clearly separate what the host can do directly from what requires escalation to GentsConcerts admins.

The report also stresses that the host role must not blur into the admin role. Hosts manage **their own** events, orders, media, and communications within approved boundaries. They should not see platform-wide user controls, creator-only infrastructure views, or unrestricted financial internals.

The UX expectations emphasize confidence and workflow clarity:

| UX principle | Meaning for host dashboard |
| --- | --- |
| Draft-first | Safe editing before public impact |
| Explain every block | Show exactly why review or publishing is blocked |
| Preserve fan trust | Highlight actions that affect ticketholders |
| Separate beta from paid | Do not imply live commercial settlement when beta is active |
| Audit meaningful actions | Key event changes and communications should be traceable |
| Mobile-capable operations | Hosts must be able to manage essentials from phone without breaking layout |

Security and authorization are again server-side requirements. An approved host may be authenticated but must only access events and ticket data they own. Submission status, review notes, orders, attendance, and communications must all respect object-level authorization.

## Immediate Host Dashboard implementation priorities

| Priority | Requirement |
| --- | --- |
| 1 | Separate pending host applicants from approved host operators |
| 2 | Build a real event draft and review workflow with clear states |
| 3 | Show host-specific ticketing and attendance metrics grounded in truth |
| 4 | Make upload/media flows reliable and transparent |
| 5 | Keep beta/free ticketing language honest while future-proofing for MoMo/PayPal |
| 6 | Limit host permissions to their own operational scope |

## Combined implication for next implementation pass

The user and host exercises together require three cleanly separated experiences. The **fan dashboard** must center on ticket ownership, order confidence, and support. The **host dashboard** must center on event operations, review readiness, and event-specific sales/attendance. The **admin dashboard** remains the creator-only control plane already being reworked. The implementation phase should therefore avoid shared ambiguous routing and should make role-based entry points explicit, server-authoritative, and easy to understand on mobile.

