# Local administration

Sign in at /admin with the account credentials in local-data/LOCAL-LOGINS.txt. Super Admin can switch among all three clusters, manage employee access, inspect the audit log, and edit main-domain/cluster content using Edit / Customize. Standard admins cannot access customization or other clusters, including through the API.

Sample cluster admins receive stays, packages, products and bookings permissions for their own cluster. Media, add-ons and review controls also enforce their applicable cluster permissions. Public review submissions require a local account and moderation before publication.

To add a staff or reviewer login, run on the server:

```sh
npm run user:add -- person@example.com
```

The command prints a unique password. A new account has no admin privileges. Sign in as Super Admin, open employee access, enter the exact local account email, assign one cluster and the necessary permissions, and save. Revoke employee access there when needed. Review-only accounts do not need an admin assignment. To reset a password use `npm run user:add -- --reset person@example.com`.

Passwords are scrypt-hashed; sessions use random tokens stored only as hashes, expire after eight hours, and are invalidated by password changes. Only server-managed session cookies establish identity. Caller-supplied identity headers are ignored. The owner email is created in the local database during setup, not taken from a public form.

The local edition shares one running server and database with enforced cluster isolation. It does not launch four independent server processes or require subdomain DNS.
