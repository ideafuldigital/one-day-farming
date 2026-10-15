# Verification report

Validation date: 2026-10-15. Runtime: Node.js 24.19.0. Production framework: Next.js 16.3.4 / React 19.2.6.

Passed: clean npm ci installation from the included lockfile; production compilation and strict TypeScript validation; 161 automated assertions across five suites:

- 29 admin checks: authorization, request validation, concurrent edits, persistence, archive, audit and privacy.
- 37 booking checks: last-place races, replay protection, holds, cancellation, pricing, nightly capacity and cluster isolation.
- 54 feature checks: owner-only customization, media guards, moderated reviews, product variants and add-ons.
- 18 local authentication/storage checks: password hashes, session hashes, forged/expired sessions, logout, password changes, lockout, transaction rollback, file storage and traversal rejection.
- 23 local route checks: setup of all four real accounts, login cookies, wrong password, cross-origin rejection, LAN-origin requests, redirect validation, owner-only endpoint access and logout.

Run `npm test` to repeat. Suites use temporary databases and do not alter your installation. Core feature suites use the SQLite-backed runtime adapter with simulated identity; local route tests use the actual password/session implementation and mock only Next's request-cookie context. They do not simulate a browser.

Changes for this edition: replaced hosted sign-in/database/object-storage dependencies with local password accounts, SQLite migrations and local uploads; added setup/reset/backup/start scripts; changed cluster navigation to local paths; removed online font loading; repaired missing transitive dependency entries in the npm lockfile; retained supplied logo, domain colors and requested simplified homepage text.

Limits: no interactive browser, physical Windows/macOS host, real phone/LAN, QR scanning, printer, or HTTPS proxy was available for testing here. Production compilation and route tests do not replace those environment checks. No claim of universal error-free operation is made. Follow the final device checks in START-HERE.md.

Bookings, vouchers and checkout remain explicitly labelled demonstrations. This package does not process real payments, send booking confirmations or connect to an external reservation system. Weather requires internet. Sample photos are bundled. Initial npm installation requires internet.
