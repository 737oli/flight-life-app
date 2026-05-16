# Issue 015: Frontend Operations Chips And Detail Panel

## Goal

Render backend operations enrichment in the mobile app.

## Why

Operational data should be glanceable on Home and richer in the detail view without crowding the dashboard.

## Scope

- Dashboard shows compact chips for the next relevant flight:
  - parking/stand;
  - registration/type;
  - CTOT/TSAT when available;
  - departure delay minutes.
- Detail view shows fuller operations panel:
  - previous flight arrival;
  - source/missing-field context;
  - walking start time.
- Clearly show live data as annotation, not replacement.

## Out Of Scope

- Do not add background refresh.
- Do not add push notifications.
- Do not revise walking time from live delay yet.

## Acceptance Criteria

- Dashboard remains compact and readable.
- Detail view carries richer operations data.
- Missing fields do not create noisy warnings.
- Planned roster data remains visible as baseline.

## Validation

- Run frontend lint.
- Manually verify with mocked and real backend operations responses where practical.

