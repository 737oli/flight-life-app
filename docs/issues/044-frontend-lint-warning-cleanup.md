# Issue 044: Frontend Lint Warning Cleanup

## Status

Done.

## Milestone

Frontend Maintenance And API Boundary Tests

## Goal

Remove the current frontend lint warnings without changing product behavior.

## Why

The frontend lint baseline should be clean so future warnings signal new work, not known noise.

## Scope

- Remove the unused `OffDayCard` duration helper.
- Correct the stale `EventDetailModal` callback dependency.
- Keep UI behavior unchanged.

## Out Of Scope

- No visual redesign.
- No operations-panel behavior change.
- No off-day display behavior change.

## Acceptance Criteria

- `npm run lint` exits cleanly.
- Existing frontend tests still pass.
- TypeScript checks still pass.

## Validation

- `npm run test`
- `npm run typecheck`
- `npm run lint`

## Dependencies

None.

## GitHub

- Frontend issue to be created/closed after implementation.
