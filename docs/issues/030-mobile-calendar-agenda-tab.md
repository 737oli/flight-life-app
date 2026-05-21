# Issue 030: Mobile Calendar Agenda Tab

## Status

Done.

## Goal

Add a mobile-first Calendar/Agenda tab that shows the full imported roster period.

## Why

Home is intentionally short-range. The user still needs a trustworthy way to inspect the full imported roster without a cramped month-grid UI.

## Scope

- Add a Calendar/Agenda tab in app navigation.
- Load roster days through the backend date-range schedule endpoint from Issue 029.
- Show the full imported roster period when available.
- Group days by week.
- Render every day, including compressed off days.
- Reuse existing day/flight detail pane patterns where possible.
- Show small decision markers on AMS-ending flight days only.

## Out Of Scope

- No month grid.
- No editable roster days.
- No AI advisor content directly in agenda rows.
- No desktop/tablet optimization.
- No background sync.

## Acceptance Criteria

- Calendar tab renders the imported roster period as a mobile agenda.
- Days are ordered and grouped correctly.
- Off days are visible but compact.
- Decision markers follow the same AMS-ending rules as Home.
- Empty/no-roster state is clear and points to Settings import.
- Existing Home behavior remains unchanged.

## Validation

- Run frontend lint/type checks available in the repo.
- Manually test iPhone/Expo flow with imported roster data.
