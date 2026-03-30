# TODO

## Current Status
- [x] Add a real super-admin role with guarded dashboard access
- [x] Build responsive super-admin views for users, vehicles, journeys, bookings, and payments
- [x] Add operational admin controls for user verification, vehicle verification, and payout-request management
- [x] Exclude failed payments from driver journey collection totals and failed amount highlights
- [x] Keep verified vehicle document replacement visible and understandable in the vehicle manager
- [x] Simplify the shared loading state so it fills the route area cleanly across public, auth, and dashboard pages
- [x] Prevent passengers from seeing or booking rides that have already departed
- [x] Cancel failed M-Pesa initialization attempts so the same ride can be booked again
- [x] Store vehicle photos and verification documents in UploadThing with proper fallbacks on ride cards
- [x] Keep account and vehicle verification in pending review until manually approved
- [x] Add route loading, route error, and not-found experiences for public, auth, and dashboard flows
- [x] Add visible pending/loading states to submit buttons across the main auth and dashboard actions
- [x] Improve placeholder contrast so empty input hints are visually distinct from entered values
- [x] Define and implement ride lifecycle state for passenger start requests and driver confirmations
- [x] Add clearer notification and status surfaces for pending ride actions and payout updates
- [x] Add clearer notification and status surfaces for pending bookings, payments, and ride actions
- [x] Add advance payment request and withdrawal request handling instead of overview-only payout tracking
- [x] Replace placeholder search inputs with real journey filtering on the public and passenger-facing screens
- [x] Audit remaining dashboard pages for calmer color usage, consistent spacing, and stronger mobile layout behavior
- [x] Review public navigation so passenger and driver intent is clearer outside the dashboard
- [x] Add a realistic seed script for sample drivers, passengers, cars, journeys, bookings, payments, payouts, and reviews

All tracked items for the current delivery pass are complete. The next backlog should be created only after manual QA or a new product brief.
