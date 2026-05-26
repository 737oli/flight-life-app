# Issue 049: Settings Local Data Reset

## Status

Completed.

## Goal

Add a Settings section that lets the user clear stale device-local cached data after backend data has been reset or changed.

## Context

Manual QA showed that old roster days can still appear on the frontend after backend runtime data is cleared, because Home can render the last successful cached schedule response when the backend is unavailable or empty. That fallback behavior is useful, but it needs an explicit reset path.

## Scope

- Add a Settings section for clearing local device data.
- Clear the cached 7-day schedule fallback.
- Clear cached last-known operations snapshots.
- Clear the frontend-only roster import timestamp display preference.
- Reset visible import result/error state in Settings after clearing.
- Preserve backend API URL, backend roster data, source PDFs, import metadata, decisions, and preferences.
- Add focused frontend tests for the cache clear helpers.

## Acceptance

- Settings shows a clear local data reset section.
- The action uses an in-app confirmation before clearing.
- Successful clearing shows a visible success state.
- Failed clearing shows a visible error state.
- Backend state is not deleted by this action.
- The local timestamp mode returns to the default local display.

## Implementation Notes

- Added `clearScheduleCache()` in `services/scheduleCache.ts`.
- Added `clearOperationSnapshots()` in `services/operationsSnapshotCache.ts`.
- Added the Settings `Clear Local Data` section with explicit copy about what is and is not deleted.
- Added `services/__tests__/localCache.test.ts`.

## Validation

- `npm run test -- --runTestsByPath services/__tests__/localCache.test.ts`
- `npm run typecheck`
