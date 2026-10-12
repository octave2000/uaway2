# Uaway operating guide

## Deployment

Use Node 24+, npm, PostgreSQL 18, and separate staging/production databases. Run `npm ci`, `npm run db:migrate`, `npm run build`, then start the web process (`npm start`) and worker (`npm run worker`). `compose.yaml` provides a local database and optional web/worker containers; migrate before starting application traffic. Never use `db:push` against production.

Required runtime environment: `DATABASE_URL`, a cryptographically random `AUTH_SECRET`, `APP_URL` (public HTTPS origin), `AUTH_TRUST_HOST=true` behind a trusted reverse proxy, Google OAuth configuration, `AUTH_EMAIL_FROM`, `HUBMAIL_KEY`, `UPLOADTHING_TOKEN`, and Daraja configuration from `.env.example`. `BOOKING_FEE_KES=0` is the pilot default. The callback URL must be the public `/api/daraja/callback` endpoint. Configure UploadThing to permit private ACL overrides before uploading identity/vehicle documents. Car photos are public; ID, selfie, and registration uploads must be private.

Provision at least two independently controlled administrator accounts. Verify their email, then run `npm run db:grant-admin -- email@example.com`. Each administrator enrolls an authenticator on first access. Runtime user preferences never grant administrative authority. `SUPER_ADMIN_EMAILS` is an optional deployment-managed bootstrap allowlist, also requiring verified email and MFA. Remove it after grants are established. Rotating AUTH_SECRET invalidates sessions and encrypted MFA secrets; coordinate MFA re-enrollment through an audited database procedure.

## Existing data migration

Back up the existing database before migration. Run `npm run db:preflight`; duplicates and negative inventory deliberately fail migration instead of silently deleting or changing financial records. Resolve them against provider records first. Never reset an existing database automatically.

Migration 0003 converts whole-KES payment amounts into additional minor-unit amounts and snapshots existing booking fares. Legacy confirmed/completed bookings are marked as having consumed inventory. Legacy pending bookings have no trustworthy hold and must be reconciled before enabling bookings. Legacy self-editable `super_admin` preferences are removed; explicitly provision legitimate admins. Legacy public identity URLs require private re-upload and re-review; do not assume copying a URL changes the provider ACL. Revoke/delete old provider assets after the owner and retention review.

Migration 0004 interprets legacy timezone-less timestamps as UTC. If the old deployment stored Nairobi wall times, adjust the migration's `AT TIME ZONE` conversion on a reviewed staging copy before applying it. Verify known historical departure/payment times. Existing collections are not silently backfilled as ledger entries: reconcile historical balances and seed opening journal entries under an audited migration before settling legacy money. Roll out on a fresh pilot production database when there is no live data.

## Payments and settlement

The worker claims payment initiation once. An API timeout is an unknown outcome, not permission to charge again. Unknown initiations are visible in the admin payment queue. Review merchant records using the booking/account reference, expected amount, and phone number; recover the provider checkout/merchant IDs only after checking the original request. Record any manual correction in `audit_events`. Then allow authenticated provider queries to reconcile the payment. Do not instruct a passenger to pay again until the unknown outcome is resolved.

Callbacks are persisted as untrusted hints. Only server-to-server query results drive confirmation. Missing or mismatched references cannot confirm bookings. Reservation expiry never converts an unknown payment into a failure. Late successful payments create full-refund allocations.

Refunds and payouts are manual pilot transfers. Confirm eligibility immediately before an external transfer. Record its unique provider reference; a second administrator independently checks the merchant statement and confirms reconciliation. The application does not send B2C disbursements. Never treat a pending or merely recorded transfer as settled. A reported issue holds unsettled funds. If an issue arrives after an external transfer, resolve the external outcome before allocating another payment.

## Monitoring and response

Monitor `/api/health` for database reachability. Monitor the worker process heartbeat and pg-boss failed/retry queues separately; a healthy web process does not prove the worker is running. Alert on `payment.reconciliation_failed`, `worker.error`, unknown initiations, reservations overdue by more than two minutes, and unsent outbox events older than five minutes. Do not log full callbacks, access tokens, document links, or customer phone numbers.

In-app notifications are deduplicated by outbox key. Email delivery is at least once: a crash after sending but before marking delivery may duplicate an email. Enable only one scheduled email consumer unless a provider-level idempotency mechanism is added. Stale journeys create support cases; they never automatically release money.

Back up PostgreSQL daily with point-in-time recovery. Before launch, restore a backup into an isolated environment, run a known booking/payment lookup, verify ledger totals and document access, and record the recovery time. Keep staging provider credentials separate from production. Deploy compatible schema changes before new application code; use a maintenance window for migrations 0003/0004.

## Launch verification still requiring configured services

- Approve an actual sandbox M-Pesa prompt; exercise rejection, delayed callback, missing callback, and unknown initiation.
- Verify private upload access as owner, reviewer with MFA, and unrelated user.
- Confirm Google login, magic-link delivery, verification links, recovery, and session revocation.
- Reconcile one refund and one payout with two real operator accounts.
- Confirm real meeting points and launch policy/contact details with operations.
- Exercise alerts and restore a production-shaped backup.

These are deployment acceptance checks, not claims that the local test suite has performed them.
