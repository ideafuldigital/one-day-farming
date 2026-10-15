# Website customization, reviews, media and pricing

## Access and site scopes

Open `/admin` using the local Super Admin account. The Super Admin can switch between Mankulam, Vattavada and Kanthallor, manage employee access, and use **Edit / Customize**. This tab and both customization API methods reject every non-owner account, including employees with legacy content grants.

Cluster employees enter at `/clusters/{cluster}/admin`. They can manage only their assigned cluster. Media and add-ons are available to active cluster administrators; stays, products, bookings and review moderation follow the assigned section permissions. Review moderation requires stays access. Revocation applies on the next protected request.

This local edition uses cluster paths on a single LAN address; no external domain or DNS is required.

## Edit / Customize — owner only

Select **main** or a cluster in the panel. Edit the brand, announcement banner, hero title/body/image/button, accent colour and footer. Empty overrides retain the existing copy or image. Each homepage section can be renamed, rewritten, illustrated, hidden or moved up/down. Other page overrides cover stays, experiences, products, gallery, about and contact.

Use HTTPS image URLs, bundled `/images/` paths or uploaded `/api/media/` URLs. Save changes to publish the content immediately. Version checks reject stale edits instead of silently replacing another admin's changes. The existing Website content section is also now owner-only and edits the cluster profile/crops.

## Gallery and homestay photos

1. Open **Media gallery**, select the scope if you are the owner, and enter a meaningful image description.
2. Drag images onto the upload area or choose files. JPEG, PNG and WebP are accepted, up to 5 MB per image. Uploaded images are public; do not upload private documents.
3. Uploaded images appear in the matching public gallery. Copy an image's URL into the listing editor or customization fields.
4. For a stay, add one image URL per line, up to eight. Its listing and detail page have carousel controls and photo thumbnails.
5. Delete asks for confirmation. Images referenced by active listing records or customization cannot be removed until those references are replaced.

The local uploads folder stores image bytes; SQLite stores metadata. Upload endpoints authenticate, enforce tenant access, bound the multipart body, check file signatures and reject SVG/non-image content. Responses use a fixed detected image MIME and `nosniff`. Deletion is soft in metadata and removes the local image file; an image cached in a browser can remain visible for up to 60 seconds.

## Ratings and review QR

A stay detail page is `/clusters/{cluster}/stay/{stay-id}`. Its QR links to the stable `/review` page beneath that route. The URL contains no token or customer information, so changing the stay name or images does not require printing another QR.

Hosts can download the high-resolution PNG or print the QR card. Visitors sign in to submit a 1–5 star rating, display name and written review. One submission is allowed per account per stay. Reviews start pending. An authorized administrator uses **Reviews** to approve or reject them. Only approved reviews contribute to the public average and list. Reviews are account-authenticated feedback, not proof of a completed booking.

## Variable prices and quantities

In a stay or experience editor, add labelled pricing options. Each option adds a non-negative INR adjustment to the applicable date rate. The existing date override → holiday → season → weekend/base priority is preserved.

For stays and vehicles, quantity means rooms/units or vehicles, and consumes that many capacity units. Guest and duration limits still apply. Admins must increase slot/shared-resource capacity and maximum guests when multiple units can be booked together. Activity pricing remains per guest. Holds and confirmed demo bookings retain their agreed price breakdown.

Products have a base pack and optional variants with independent prices. Visitors choose a variant and quantity before adding it to the basket. Each variant is a separate basket line. The server recalculates current product prices and availability before a demo order is prepared. A changed price requires reloading to review it.

## Add-ons

Both the owner and active cluster admins use **Add-ons** to create, edit, disable or delete options. Configure the price, maximum selectable quantity, description and one charging basis:

- **booking**: once per selected quantity.
- **person**: selected quantity × guest count.
- **night**: selected quantity × occupied nights (one for an activity).
- **person_night**: selected quantity × guests × occupied nights.

Leave service IDs empty for all services in the assigned cluster, or enter its stay/experience IDs separated by commas. Other-cluster or missing IDs are rejected. Visitors toggle extras and select quantities. Prices are calculated on the server; disabled/deleted options cannot be newly booked. Saved booking totals remain unchanged.

## Schema and verification

Active schema: `db/schema.ts`. The new schema-only migration is `drizzle/0002_fair_the_fury.sql`, adding site customizations, media, add-ons and reviews. Pricing options and product variants live in the existing managed-record JSON. Reservation selections and price snapshots live in booking-state JSON. Keep all older migrations unchanged.

Run:

```sh
npm test
npm run build
```

Automated checks use isolated SQLite and an in-memory upload store, never production customer data. They cover owner-only access, cross-cluster denial, CSRF, version conflicts, image deletion guards, moderation/privacy, authoritative variant/add-on pricing, capacities, concurrent last-place holds and cancellation. Interactive browser testing was unavailable in the implementation environment; responsive layouts and print rules were reviewed in source.

## Deployment limits

The connected database, image uploads, permissions, content and moderation are implemented. Booking capacity and checkout remain explicitly labelled demonstrations. No real charge, SMS, settlement, courier order or host reservation is created. The package contains source, migrations, assets and guides, not production database rows, image uploads, secrets or dependencies.

Local password authentication and server-managed sessions are included. See ADMIN-GUIDE.md.
