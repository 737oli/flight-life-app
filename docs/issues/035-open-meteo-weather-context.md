# Issue 035: Open-Meteo Weather Context For Decisions

## Status

Done.

## Goal

Add secondary weather context for stay-vs-home decisions using Open-Meteo.

## Why

Weather can affect commute and recovery decisions, but it should remain supporting context rather than a headline feature or blocker.

## Scope

- Add backend weather provider support using Open-Meteo first.
- Fetch only decision-relevant windows for AMS, home area, and next-duty AMS where useful.
- Summarize weather into compact facts such as rain likely, strong wind, low visibility, normal conditions, or unavailable.
- Feed summarized facts into the decision context builder.
- Keep weather unavailable as a quiet degraded state unless it materially affects confidence.
- Add caching appropriate for forecast data.

## Out Of Scope

- No weather dashboard.
- No aviation METAR/TAF parsing.
- No push alerts.
- No frontend weather widgets outside AI/decision context.

## Acceptance Criteria

- Backend can retrieve and summarize weather context for decision windows.
- Weather provider failure does not block deterministic decisions or AI advisor use.
- GPT receives summarized weather facts only, not full forecast dumps.
- Tests mock weather provider responses and cover normal, adverse, unavailable, and cache behavior.

## Validation

- Run focused backend weather-context tests.
- Run full backend `pytest`.
