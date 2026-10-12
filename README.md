# Uaway

Scheduled carpooling for Kenya: public discovery, verified passengers and drivers, approved vehicles, seat reservations, M-Pesa collections, individual boarding/arrival, support, refunds, and independently reconciled payouts.

## Run locally

Use Node 24+ and npm. Copy `.env.example` to `.env` and configure your development providers. Start PostgreSQL (`docker compose up -d db`), then:

```sh
npm ci
npm run db:migrate
npm run dev
# In another terminal:
npm run worker
```

Local Compose database URL: `postgres://uaway:local-development-only@localhost:5432/uaway`.

## Architecture

- `app/`: server-rendered screens, thin mutation actions, provider/status routes.
- `lib/domain/`: reservations, journeys, vehicles, ride progress, settlement, policies, and shared transaction helpers.
- `lib/payments/`: Daraja adapter and authenticated reconciliation.
- `lib/auth/`: authorization, MFA, account verification/recovery.
- `db/`: typed schema and versioned non-destructive migrations.
- `worker/`: durable scheduled payment reconciliation, reservation expiry, reminders, exceptions, and email.

PostgreSQL is the source of truth. Reservations use row locks; side effects use transactionally written events; money is recorded in minor units with immutable debit/credit entries. Administrative permission is separate from the passenger/driver interface preference.

## Verify

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Integration tests create an isolated temporary PostgreSQL cluster. Alternatively set `TEST_DATABASE_URL` to a database whose name contains `test`. They never use your ordinary DATABASE_URL for test writes. Browser tests need a migrated development/test database and build-time/runtime auth environment. CI provisions its own database.

Read [the operating guide](docs/OPERATIONS.md) before migration or launch. External provider credentials, operator accounts, and sandbox acceptance are required before production launch.
