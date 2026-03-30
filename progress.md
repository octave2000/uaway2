# Progress

## 2026-03-30 Super Admin Dashboard
- [x] Added a real `super_admin` role path on top of the existing passenger and driver model
- [x] Added configured super-admin email support through `SUPER_ADMIN_EMAILS`
- [x] Updated the dashboard shell and public navbar to recognize super-admin navigation
- [x] Built a responsive super-admin overview on `/dashboard` with platform-wide metrics and review queues
- [x] Added dedicated super-admin pages for users, vehicles, journeys, bookings, and payments
- [x] Added super-admin actions for manual user verification, vehicle verification, and payout request status management
- [x] Hid standard passenger/driver dashboard mode switching for super-admin accounts
- [x] Verified the full admin build with lint and typecheck

## 2026-03-18 Hardening Pass
- [x] Removed departed rides from public and passenger discovery flows and blocked stale bookings at action level
- [x] Added journey notes and redirected drivers straight into the journey management page after posting
- [x] Cancelled failed M-Pesa initialization attempts so passengers can retry booking cleanly
- [x] Fixed the driver payments page timestamp crash when `CURRENT_TIMESTAMP` comes back as a string
- [x] Moved vehicle photos, identity documents, selfies, and car documents to UploadThing
- [x] Added default vehicle imagery and surfaced actual car photos on ride cards and ride details
- [x] Kept driver and vehicle verification in manual review state instead of auto-marking as verified
- [x] Added animated loading screens, route error screens, dashboard/public 404 pages, and page-enter motion
- [x] Added pending/loading button states across auth, booking, payout, profile, vehicle, and journey forms
- [x] Improved placeholder contrast for shared inputs and journey note entry fields
- [x] Ran verification after each batch and kept commit history segmented by fix area

## 2026-03-18 Follow-up Fixes
- [x] Stopped failed payment attempts from inflating the driver journey "Collected" total
- [x] Kept the verified vehicle screen explicit about uploading replacement registration documents
- [x] Replaced the complex route loader with a simpler full-area shared loading state
- [x] Re-ran full lint and typecheck after the follow-up fixes

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
- Commits created in this pass:
  - `a8dfa6a` `fix: enforce dashboard role boundaries`
  - `88a823b` `feat: add vehicle detail management`
  - `9d1f509` `feat: add driver payments overview`
  - `d50df99` `feat: add ride lifecycle and mpesa payment flow`
  - `b48dd8c` `feat: add journey search and sample seed data`
  - `ab68ace` `fix: block stale ride bookings and add journey notes`
  - `172b6e9` `feat: add uploadthing-backed car and verification uploads`
  - `0e2c2e0` `feat: add route feedback and form loading states`
  - `d58b673` `fix: exclude failed payments from journey totals`
  - `562e1c0` `fix: keep verified car document uploads accessible`
  - `96bb596` `refactor: simplify shared route loading state`
  - `4d9f4a6` `feat: add super admin dashboard and controls`
