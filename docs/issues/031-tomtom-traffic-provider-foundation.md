# Issue 031: TomTom Traffic Provider Foundation

## Status

Ready.

## Goal

Add the backend foundation for traffic-aware expected travel times using TomTom.

## Why

Stay-vs-home decisions need realistic travel-time context. The backend should gather this data directly so the frontend never stores traffic credentials and GPT receives only summarized derived facts.

## Scope

- Add a backend traffic provider abstraction with a TomTom implementation.
- Keep TomTom API key backend-only via environment/config.
- Store exact home coordinates backend-side only in local config/database.
- Support only AMS-to-home and home-to-AMS stay-vs-home routes.
- Query traffic for the relevant planned decision window.
- Return derived facts such as expected minutes, normal minutes, traffic delay minutes, provider, retrieved time, and availability status.
- Add short traffic-result caching where appropriate.

## Out Of Scope

- No Google Routes provider.
- No Waze/Home Assistant adapter.
- No frontend UI.
- No GPT/OpenAI call.
- No weather context.

## Acceptance Criteria

- Backend can compute traffic context for AMS-to-home and home-to-AMS decision routes when configured.
- Missing key, missing home coordinates, or provider failure degrades cleanly.
- Raw coordinates are not sent to GPT-facing structures unless explicitly required later.
- Tests mock provider HTTP calls and cover success, unavailable provider, missing config, and cache behavior.

## Validation

- Run focused backend traffic tests.
- Run full backend `pytest`.

