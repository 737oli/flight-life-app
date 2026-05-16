# Issue 005: Date-Scoped Roster Import Merge And Import Summary

## Goal

Implement the import behavior that applies a valid parsed roster to persistent storage by replacing only dates included in the roster period.

## Why

Weekly roster PDFs cover Monday plus four weeks. A new import must not delete current-week data outside the imported period.

## Scope

- Apply parsed roster data inside a database transaction.
- Replace/update only dates present in the imported roster period.
- Preserve existing dates outside that period.
- Preserve manual decisions when the underlying duty is substantially the same.
- Mark related decisions as needing review when duty type, route sequence, overnight station, or start/end time changes materially.
- Use 60 minutes as the first material time-change threshold.
- Return import summary counts:
  - roster period;
  - duty days parsed;
  - flights parsed;
  - rests/taxis/hotels parsed where available;
  - inserted dates;
  - updated dates;
  - unchanged dates;
  - warnings.

## Out Of Scope

- Do not implement frontend import summary UI.
- Do not implement user-editable threshold settings yet.
- Do not implement full stay-vs-home engine.

## Acceptance Criteria

- Existing data outside imported period remains available.
- Overlapping dates are updated atomically.
- Failed import application rolls back.
- Import summary is deterministic and test-covered.

## Validation

- Run import merge tests covering non-overlap, overlap, unchanged days, material changes, and rollback.

