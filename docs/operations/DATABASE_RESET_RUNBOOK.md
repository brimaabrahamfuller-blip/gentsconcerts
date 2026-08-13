# GentsConcerts Production Database Reset Runbook

## Purpose and guardrail

This runbook governs a **fresh-start reset of the GentsConcerts application data**. It does not authorize deletion merely because the document exists. A reset may occur only after the owner has reviewed the final manifest and explicitly authorized the deletion in writing.

The reset scope is limited to GentsConcerts application collections, including user accounts, events, tickets, transactions, audit/flag records, and GridFS promotional-video files. It must not delete the MongoDB project, cluster, database users, connection credentials, provider backups, or unrelated databases.

> **Never run an unreviewed destructive command against production.** The reset is irreversible from the live database. Recovery depends on a verified backup or provider snapshot.

## Roles

| Role | Responsibility |
|---|---|
| Owner | Approves the final manifest, backup retention period, and production deletion. |
| Release operator | Creates and verifies the backup, runs the preflight, performs the approved reset, and records the outcome. |
| Technical reviewer | Confirms the collection scope, backup-read check, hardened schema/index deployment, and post-reset checks. |

## Required controls before approval

The release operator must first produce a read-only manifest:

```bash
cd backend
npm run db:reset:preflight -- --write-manifest
```

The command lists collection names, document counts, and indexes. It does **not** write to MongoDB. The generated manifest is deliberately excluded from Git because it contains production metadata.

Before any deletion, complete all of the following:

| Control | Required evidence |
|---|---|
| Provider backup or encrypted database export | Timestamp, destination, retention period, and encrypted-access owner recorded outside Git. |
| Restore validation | Restore into a non-production database, or demonstrate that the exported archive can be read and contains the expected collection/data structure. |
| Final manifest | Exact collections and document counts reviewed by the owner. |
| Maintenance window | Site writes paused; background jobs disabled or stopped; operational contact available. |
| Authorization | Owner explicitly approves deletion of the listed application collections after backup verification. |
| Bootstrap plan | Owner/admin email and initial approved-host plan recorded before reset. |

## Required confirmation language

The owner must explicitly confirm this statement, with the final manifest attached or available for review:

> “I authorize a production reset of the GentsConcerts application database, deleting the listed collections—including users, events, tickets, transactions, media/GridFS files, flags, and activity logs—after a verified backup/export has completed. This cannot be undone from production; recovery would require restoring the backup.”

An ambiguous reply such as “go ahead,” “reset it,” or “yes” without the final manifest context is insufficient.

## Reset execution sequence

The destructive reset implementation must not be written or run until the controls above are complete. When authorized, the operator will:

1. Place the application in a planned maintenance/read-only state.
2. Stop processes that can create events, tickets, media, or background cleanup records.
3. Capture final collection counts and the preflight manifest.
4. Confirm the backup and restore validation.
5. Delete only the owner-approved application collections; do not drop the cluster or unrelated databases.
6. Deploy the hardened schema/index changes.
7. Bootstrap only the approved owner/admin account and optional approved test host.
8. Verify that public events, tickets, transactions, and GridFS media are empty.
9. Run a private end-to-end test event through the new controls.
10. Record the reset time, operator, approval reference, collection list, and verification result.

## Post-reset verification

The database reset is considered complete only if all checks pass.

| Check | Expected result |
|---|---|
| Public events API | Empty or contains only explicitly approved current published events. |
| Ticket and transaction collections | Empty until a new beta claim occurs. |
| GridFS media collections | Empty unless newly seeded/approved media exists. |
| Admin access | The approved owner account can access required controls. |
| Host approval | An ordinary attendee cannot publish or scan tickets. |
| Event creation | A new event starts as a draft/pending review, not public. |
| Ticket claim | Capacity, duplicate-claim, and scanner-authority controls work in a private rehearsal. |

## Recovery principle

If any destructive action is taken outside the approved scope or post-reset verification fails, stop the release, preserve logs/manifest/approval evidence, and restore only from the verified backup under the owner’s direction. Do not attempt improvisational data repair against production.
