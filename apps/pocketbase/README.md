# Hustl PocketBase Backend

This app uses the local PocketBase source checkout at:

```text
/Users/ankanghosh/Downloads/pocketbase-master
```

The Go module is wired with a `replace` directive, so this app builds against that local source instead of downloading PocketBase.

## Run

Go 1.25+ is required.

```bash
cd apps/pocketbase
go mod tidy
go run . serve --http=127.0.0.1:8090
```

Health check:

```bash
curl http://127.0.0.1:8090/health
```

PocketBase admin UI:

```text
http://127.0.0.1:8090/_/
```

## Hustl Collections

Import the schema at:

```text
apps/pocketbase/pb_schema/hustl.collections.json
```

It mirrors the launch product contract:

- Users, students, businesses, colleges, and admin accounts.
- Listings, swipes, matches, smart-match score snapshots, and shift check-ins.
- Admin reports, dispute threads, and dispute messages.
- Reputation events for reviews, late cancellations, no-shows, completed shifts, and admin adjustments.
- Wallets, wallet transactions, boosts, story-style portfolio assets, and listing analytics.

## Operational Notes

- PocketBase uses SQLite, so it is good for fast launch velocity and a built-in admin panel.
- The existing Express/Postgres backend still exists. Do not run both as production sources of truth for the same data.
- If PocketBase becomes the primary backend, the mobile app should move to the official PocketBase JS SDK and the Prisma schema should become reference/migration history only.
- Server-side hooks still need to enforce hard business rules: 200m check-in radius, late cancellation reputation deltas, no-show urgent suspension, wallet ledger idempotency, and role-based admin actions.
