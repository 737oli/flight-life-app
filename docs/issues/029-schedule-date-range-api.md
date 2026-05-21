# Issue 029: Schedule Date-Range API

## Status

Done.

## Goal

Expose a backend schedule endpoint that can return a caller-selected date range for the full mobile agenda view.

## Why

Home intentionally stays focused on the next 7 days. The Calendar tab needs the full imported roster period without making the frontend infer date ranges or duplicate schedule assembly logic.

## Scope

- Add a date-range schedule endpoint, for example `GET /schedule?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`.
- Reuse the existing schedule DTO shape where practical.
- Validate date input and reject invalid ranges clearly.
- Return every calendar date in the requested range.
- Keep `/schedule/next-7-days` stable for Home.

## Out Of Scope

- No frontend Calendar tab.
- No month grid.
- No AI, traffic, or weather context.
- No roster edit UI.

## Acceptance Criteria

- A date-range request returns all requested dates in order.
- Off days, flight duties, other duties, warnings, and import metadata remain trust-preserving.
- Existing next-7-days API behavior remains unchanged.
- Invalid ranges return a clear validation error.
- Backend tests cover happy path, empty/no-data dates if applicable, invalid ranges, and compatibility with the existing schedule DTO.

## Validation

- Run focused backend schedule tests.
- Run full backend `pytest`.
