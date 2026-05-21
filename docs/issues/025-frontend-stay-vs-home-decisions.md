# Issue 025: Frontend Stay-Vs-Home Decision Integration

## Status

Done.

## Goal

Replace the mock Decisions tab with backend stay-vs-home recommendations and manual override actions.

## Why

The backend owns the deterministic decision engine, but the frontend still showed local mock recommendations. The app should show real recommendations from parsed roster data and let the user save a manual choice for the current duty decision.

## Scope

- Fetch the next 7-day schedule from the backend.
- Request stay-vs-home decisions for upcoming non-off duty days.
- Render recommendation, state, missing inputs, and reasoning.
- Save manual overrides through the backend override endpoint.
- Show backend errors without crashing.

## Out Of Scope

- Do not add push notifications.
- Do not add advanced scoring.
- Do not add a full decision history view.
- Do not add local-only manual decisions.

## Acceptance Criteria

- Decisions tab no longer depends on hard-coded mock recommendations.
- Backend recommendation states render clearly: recommended, overridden, and needs review.
- Manual choices are persisted through the backend.
- Missing or weak inputs render as review context instead of fake certainty.

## Validation

- Run frontend TypeScript compile.
- Run frontend lint.
- Manually smoke test against the local backend.
