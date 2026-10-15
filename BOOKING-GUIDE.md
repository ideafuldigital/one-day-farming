# Booking engine V1 — demonstration inventory

Open /admin, choose a cluster, then Bookings. Booking-section permissions control pricing, capacity, closures and manual reservations. Existing employee restrictions remain server enforced.

The visitor Stay and Experience booking dialogs now show 30-day availability, slots, price breakdowns and policy acceptance. Use the date control to view later dates, or change guests/nights to recalculate. Stays occupy every night before checkout. All time boundaries use Asia/Kolkata.

## Rates and limits

Specific-date rate overrides holiday rate, which overrides a season's weekday/weekend rate, which overrides the standard weekday/weekend rate. Overlapping seasons and duplicate price dates are rejected. Rates are absolute, never added together. Breakfast remains ₹300 per guest per night; no live taxes or payment fees are assessed.

Daily guest and booking limits apply per service. Stay capacity is accommodation units; jeep capacity is vehicles; walk capacity is guests. Stay and jeep bookings reserve the selected number of units or vehicles. A shared resource name links services to one capacity pool at overlapping slots/nights. Use identical resource capacities for linked services. Resource reassignments with active bookings are rejected. Existing catalogue capacity remains the upper bound on group size.

A five-minute checkout hold consumes capacity. Confirmation preserves the quoted price and accepted conditions. Cancellation or expiry releases capacity. Simultaneous requests use a cluster-level database version comparison and retry; one update commits per state version. Repeat request keys return the same booking. Manual bookings use the same capacity checks. Admin setting changes are version checked and logged.

Disabling a service or closing a date stops new bookings without silently cancelling existing records. Capacity reductions that conflict with current reservations are rejected. Reschedule by explicitly cancelling then creating a new checked booking; there is no atomic rescheduling action in V1.

## Demonstration data

Each cluster initializes demonstration inventory once, when first accessed. Samples cover the next 30 days. Walks include full/limited morning slots, day +7 reaching the five-booking daily limit and day +14 reaching the thirty-guest daily limit; day +3 is closed; day +5 has a closed morning slot; day +6 has a holiday rate. Day +8 includes cancelled bookings, day +9 expired holds, and days +10–20 have season prices. Sample cottage services start disabled. Seed reservations are fictional and contain no customer contact data.

Reset demo bookings clears only this cluster's demo-engine reservations and preserves pricing, settings and legacy internal records. It does not repopulate records. Add manual demo bookings to create other scenarios.

Legacy internal records appear separately below the new controls and DO NOT affect inventory. All new capacity-managed reservations must use the new form. Real booking migration requires verified inventory and a separate launch plan.

## Scope and operational limits

No real reservations, payments or SMS are created. This database holds only demo inventory. Visitor confirmation/cancellation requires the unguessable receipt token held in the open booking dialog. Closing the dialog loses that visitor control; authorized admins can still cancel it. Payment callbacks are not connected. Public demo checkout is intentionally unauthenticated and not suitable for live commerce without customer identity, abuse controls and payment integration.

The cluster-state approach is suitable for this bounded demo; it caps records at 5,000 per cluster. A production system should normalize inventory/booking tables and add retention, payment reconciliation and operational monitoring.

Validation: npm test; strict TypeScript; Next.js production build. Browser visual/sign-in QA was unavailable in this environment.
