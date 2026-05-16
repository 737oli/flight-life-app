# Issue 012: Deterministic Stay-Vs-Home Decision Engine

## Goal

Implement the first deterministic stay-vs-home recommendation engine on the backend.

## Why

The app should help with personal planning decisions, not only display the roster.

## Scope

- Add backend decision service.
- Use deterministic inputs:
  - arrival station;
  - next duty start;
  - time between duties;
  - travel time home;
  - hotel/rest availability;
  - useful time at home;
  - preferences.
- Return recommendation, reasoning, and state.
- Include "needs review" when inputs are missing or weak.
- Allow manual override for the current duty/decision.

## Out Of Scope

- No AI/ML scoring.
- No advanced optimization.
- No push notifications.

## Acceptance Criteria

- Backend returns stay/home/needs-review recommendation.
- Reasoning explains the recommendation.
- Manual override is preserved.
- Changed duties can mark decisions as needing review.

## Validation

- Run decision engine tests for stay, home, missing input, and changed-duty cases.

