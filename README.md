# One Day Farming — local computer and network edition

Read START-HERE.md first. This package includes the main website, three cluster websites, a Super Admin dashboard and three separate cluster-admin workspaces. It runs on one computer with a persistent SQLite database and local image storage. No cloud account, subscription, or database server is required.

Requirements: Node.js 24 or newer, npm, Windows/macOS/Linux, and internet access for the initial dependency installation. Use Node 24 LTS. Run commands from this extracted folder. Do not open HTML files directly.

```sh
npm ci
npm run setup
npm test
npm run build
npm start
```

Open http://localhost:3000/admin. Setup writes unique passwords to local-data/LOCAL-LOGINS.txt. Start prints the network address for other devices. This is a source package; dependencies and the production build are generated on your computer.

See START-HERE.md for network hosting, ADMIN-GUIDE.md for accounts, TEST-REPORT.md for verification and limitations, and BOOKING-GUIDE.md / FEATURE-GUIDE.md for feature behavior.
