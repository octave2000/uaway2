# Progress

## 2026-03-16 Audit
- [x] Read [.material/docs/PROJECT_DETAILS.md] and [.material/note.md]
- [x] Reviewed implemented routes, dashboard flows, and server actions
- [x] Identified role leakage between passenger and driver flows
- [x] Confirmed documented gaps still open: payment management, ride start confirmation, notifications, refunds, vehicle edit flow

## 2026-03-16 Active Work
- [x] Added shared server-side role helpers
- [x] Guarded driver-only pages and actions for vehicles and journey posting
- [x] Guarded passenger-only pages and actions for booking and reviews
- [x] Made dashboard navigation role-aware
- [x] Split the journeys page into clearer passenger and driver experiences
- [x] Added a driver-only vehicle detail page with edit and verification actions
- [x] Added a driver-only payments overview page and wired it into navigation
- [x] Added Flutterwave M-Pesa booking initiation, webhook verification, lifecycle controls, and payout requests
- [x] Replaced placeholder search with real filtering on the public home page and passenger journey screens
- [x] Added and executed a seed script for realistic sample users, cars, journeys, bookings, payments, payouts, and reviews
- [x] Made the public navbar and homepage CTA role-aware
- [x] Run full verification and fix regressions for the completed changes
- [x] Closed the current delivery checklist in `todo.md`

## Notes
- Previous tracker files overstated project completion; they have been reset to match the real implementation state.
- Current focus is correctness first: permissions, route boundaries, and consistent mobile-friendly UI for each role.
- Local development schema was synced with `npm run db:push` because the existing migration history in the database did not match Drizzle's ledger, and `npm run db:seed` was rerun successfully after that sync.
- Commits created in this pass:
  - `a8dfa6a` `fix: enforce dashboard role boundaries`
  - `88a823b` `feat: add vehicle detail management`
  - `9d1f509` `feat: add driver payments overview`
  - `d50df99` `feat: add ride lifecycle and mpesa payment flow`
  - `b48dd8c` `feat: add journey search and sample seed data`
