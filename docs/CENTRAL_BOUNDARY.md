# OB-Tracker ↔ onBlank Central Boundary

Central does not exist yet; OB-Tracker defines the portable time-tracking contract first.

## Shared concepts

Worker identity for time ownership, Clients, Projects, Tasks, historical Billing Terms and Time Entries.

## What Central may add later

Central can wrap the shared entities with PostgreSQL-native platform concerns such as organization/tenant IDs, organization members, RBAC, audit actors, subscriptions and accounting links.

Those additions must not become required to read an `.obtracker` v1 export.

## Forbidden in OB-Tracker

No Central URL, token, API, websocket, OAuth flow, sync worker, cloud database or “Connect to Central” feature.

The only bridge is:

```text
OB-Tracker -> local .obtracker file -> importer owned by destination
```
