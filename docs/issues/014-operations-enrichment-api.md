# Issue 014: 90-Minute Operations Enrichment API

## Status

Done.

## Goal

Expose project-owned operations enrichment for flights within 90 minutes of current time.

## Why

The frontend needs compact live operations data without knowing AF/KLM API details or credentials.

## Scope

- Determine eligible flights from persisted schedule.
- Fetch live enrichment only inside the 90-minute window.
- Return normalized operations DTOs.
- Keep scheduled roster data as baseline.
- Include walking start time based on scheduled departure minus configured walking buffer.

## Out Of Scope

- Do not revise walking time based on delayed aircraft yet.
- Do not fetch live data for the full roster.
- Do not reorder schedule rows.

## Acceptance Criteria

- Flights outside the 90-minute window return scheduled-only state.
- Eligible flights can include CTOT, TSAT, parking position, previous flight arrival, delay minutes, registration, and type when available.
- Missing fields are quiet unless decision-critical.

## Validation

- Run operations API tests with frozen time and mocked AF/KLM responses.

## Completed Notes

- Added backend `GET /operations/flights/{flight_leg_id}`.
- Determines 90-minute eligibility from persisted roster flight-leg schedule data.
- Returns scheduled baseline and walking start time for all known flight legs.
- Fetches live AF/KLM enrichment only inside the operations window.
- Handles missing credentials or live API failures as unavailable live enrichment without replacing planned roster data.
