# Issue 009: Home 7-Day Dashboard From Backend Data With Fallback Cache

## Status

Done.

## Goal

Replace mock Home schedule data with the backend next-7-days API and cache the last successful response as read-only fallback.

## Why

The first product milestone is only useful once Home shows real parsed roster data.

## Dependencies

- Blocked by Issue 006.
- Blocked by Issue 007.
- Blocked by Issue 019.
- Blocked by Issue 020.

## Scope

- Fetch next-7-days schedule from backend.
- Map backend DTOs to frontend render models.
- Render every day in the next 7 days.
- Visually compress simple off days.
- Show empty/import-needed state when no roster exists.
- Cache the last successful schedule response locally.
- When backend is unreachable, show cached planned data with live data unavailable.

## Out Of Scope

- Do not add live operations enrichment yet.
- Do not build full calendar/month view.
- Do not make cached data editable.

## Acceptance Criteria

- Home no longer depends on mock schedule data for the main schedule path.
- Missing backend shows clear connection/fallback state.
- Cached data is labeled as fallback when used.
- The app never hides days from the 7-day horizon.

## Validation

- Run frontend lint.
- Add/run frontend behavior tests if tooling exists.
- Manually verify with backend sample data.
