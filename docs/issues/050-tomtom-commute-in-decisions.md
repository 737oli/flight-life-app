# Issue 050: TomTom Commute In Decisions

## Status

Completed.

## Goal

Use backend TomTom traffic context in the normal stay-vs-home decision DTO so the Decisions tab can replace the fixed `Commute assumption: 60 min each way` line with route-specific expected commute times when available.

## Context

TomTom traffic context already existed for the AI advisor path. The standard decision endpoint still returned only the configured commute preference, so Home, Calendar, and Decisions displayed the fallback assumption even when TomTom was configured and operational readiness was ready.

## Scope

- Fetch backend-owned TomTom stay-vs-home traffic context when `GET /decisions/stay-vs-home/{decision_date}?include_traffic=true` is requested.
- Include route-specific commute fields in decision reasoning:
  - `home_commute_source`;
  - `home_commute_minutes_to_home`;
  - `home_commute_minutes_to_airport`;
  - `home_commute_round_trip_minutes`;
  - `traffic_warnings`.
- Keep `home_commute_minutes_each_way` for compatibility and fallback display.
- Use TomTom route minutes for useful-home-time calculation when available.
- Fall back to configured commute preference when TomTom is unavailable, missing coordinates, or missing a route.
- Update the Decisions tab to request traffic-aware decision DTOs.
- Update frontend decision reasoning presentation to show `TomTom commute: X min home, Y min to AMS`.
- Keep provider failures non-blocking.

## Acceptance

- Decisions tab no longer shows the fixed commute-assumption line when both TomTom route estimates are available.
- If TomTom is unavailable, the UI clearly falls back to the configured commute assumption.
- Deterministic decision API remains backend-owned and does not expose API keys or coordinates.
- Existing AI advisor context uses the same traffic-aware rule-decision payload.
- Tests cover backend reasoning fields and frontend reasoning text.

## Validation

- `.venv/bin/python -m pytest tests/test_decision_service.py tests/test_decision_context_service.py tests/test_traffic_service.py`
- `npm run test -- --runTestsByPath services/__tests__/decisionPresentation.test.ts`
- `npm run typecheck`
