# Setup on your computer

1. Install Node.js 24 LTS with npm. Check `node --version` reports v24 or newer.
2. Extract this ZIP to a normal writable folder such as Documents/One-Day-Farming. Do not run inside the ZIP.
3. Open Terminal in that folder (Windows: open the folder, type `cmd` in Explorer's address bar and press Enter).
4. Run these commands, one at a time. The first command needs internet access:

```sh
npm ci
npm run setup
npm test
npm run build
npm start
```

5. Keep the terminal running. Open http://localhost:3000 for the website or http://localhost:3000/admin for administration.
6. Open `local-data/LOCAL-LOGINS.txt` in a text editor. It contains the exact generated password for each account:

| Role | Email | Panel |
| --- | --- | --- |
| Super Admin | superadmin@oneday.local | /admin |
| Mankulam Admin | mankulam@oneday.local | /clusters/mankulam/admin |
| Vattavada Admin | vattavada@oneday.local | /clusters/vattavada/admin |
| Kanthallor Admin | kanthallor@oneday.local | /clusters/kanthallor/admin |

These are local usernames; email delivery and real email inboxes are not required. There is no single preset password. Setup generates a different strong password for each account and preserves existing accounts when rerun. Change each password using “Change password” in the dashboard. Store the new passwords privately and remove LOCAL-LOGINS.txt when no longer needed.

## Open on other devices on your network

- Connect the server computer and phone/laptop to the same trusted Wi-Fi/LAN. Avoid guest Wi-Fi, which often isolates devices.
- `npm start` prints addresses such as `http://192.168.1.10:3000/admin`. Enter that address on the other device. `localhost` on a phone means the phone itself, not your server.
- If Windows Firewall asks, allow Node.js on your Private network. Alternatively allow inbound TCP port 3000 on the Private profile only. On macOS allow incoming connections for Node if prompted. Do not disable your firewall.
- Leave the server computer awake and the terminal open. Stop with Ctrl+C. On later runs use only `npm start`; rebuild after code changes.
- If the router changes the computer's IP, use the newly printed address. A DHCP reservation in your router can keep it stable.
- This edition uses path-based clusters, so no DNS/subdomain setup is necessary: `/clusters/mankulam`, `/clusters/vattavada`, `/clusters/kanthallor`. Each still has its own admin permissions and branding.
- Open the site through its LAN address before downloading a review QR code. A QR generated from localhost will not open on another device. Reprint QR codes if the server address changes.

HTTP is suitable for a trusted testing LAN; it does not encrypt passwords in transit. For real customer/private data, configure HTTPS through a trusted reverse proxy and set COOKIE_SECURE=1. Do not expose this test server through router port forwarding.

## Persistent data, backup, and recovery

Data lives in `local-data/website.sqlite` and `local-data/uploads`. Keep this folder when updating source. Do not share it with the source ZIP. Never delete it to “restart” the website unless you intend to erase the installation.

Stop the server, then run `npm run backup`. The timestamped `backups` folder contains the database and uploaded images. To restore, stop the server, save your current local-data elsewhere, create an empty local-data folder, and copy website.sqlite and uploads from the selected backup into it. Do not mix old database WAL/SHM files with a restored database. Backups contain private accounts and business data; keep them private.

Forgot a password? On the server computer:

```sh
npm run user:add -- --reset superadmin@oneday.local
```

This prints a new password and invalidates that account's sessions. Substitute a cluster-admin email to reset that account. Server filesystem access is trusted administrative access.

## Troubleshooting

- `node:sqlite` missing: install Node 24+, reopen Terminal, check `node --version`.
- “next not found”: run `npm ci` in this folder.
- “Run npm run build first”: run `npm run build`, then `npm start`.
- Port 3000 already used: Windows cmd `set PORT=3001` then `npm start`; macOS/Linux `PORT=3001 npm start`. Use the changed port on all devices.
- Cannot connect from phone: verify IP, port, same Wi-Fi, private firewall allowance, guest-network isolation and VPN settings.
- Incorrect credentials: copy the password without spaces; ten failed attempts lock that account for 15 minutes.
- Missing weather: weather needs internet; core local features and bundled images do not.

Before using real data: log in as each role, check mobile layout, upload/delete a test image, save a test record, create a demo booking, restart the server and confirm saved records persist. Test a QR from another device using the LAN address.
