# Issue 011: Backend Preferences Model And Settings Integration

## Goal

Add backend-owned preferences and expose them through Settings.

## Why

Walking time, home-base assumptions, material-change threshold, and stay-vs-home defaults affect backend-owned decisions and import logic.

## Scope

- Persist preferences in SQLite.
- Add preferences API.
- Add Settings UI for viewing/editing initial preferences:
  - home base airport;
  - AMS walking buffer, initially 40 minutes;
  - commute/home travel assumptions;
  - material-change threshold, initially 60 minutes.
- Frontend may cache preferences for display, but backend remains source of truth.

## Out Of Scope

- Do not implement revised walking time based on live delays.
- Do not implement advanced preference profiles.
- Do not implement multi-user preferences.

## Acceptance Criteria

- Preferences have defaults.
- Preferences can be read and updated.
- Backend uses stored preference values where applicable.

## Validation

- Run backend preference tests.
- Run frontend lint and manually verify Settings behavior.

