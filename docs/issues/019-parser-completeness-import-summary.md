# Issue 019: Parser Completeness Validation And Import Summary Refinement

## Status

Done.

## Goal

Make import summaries better at distinguishing "valid with warnings" from "not trustworthy enough."

## Why

The import can be valid even when some flight-duty legs are still missing, but the user needs to see parser completeness clearly before trusting Home.

## Scope

- Keep imports allowed when the roster period and duty table are valid.
- Surface `flight_duty_days_without_legs`.
- Surface `parser_warning_count`.
- Keep affected schedule days as `other_duty` with warnings instead of inventing flights.
- Preserve repeat-import unchanged behavior.

## Out Of Scope

- Do not block all imports with parser warnings.
- Do not hide affected days.
- Do not fake missing flight legs.

## Acceptance Criteria

- Re-importing the same parsed roster still gives `inserted_dates: 0`, `updated_dates: 0`, and `unchanged_dates` for the full roster period.
- Import response makes parser completeness easy to judge.
- Schedule API remains trust-preserving: no missing or reordered days, no silent fake flights.

## Validation

- Run import summary tests.
- Run schedule DTO tests for missing-leg flight duties.
- Run counts-only local repeat-import QA against `rosters/<local-private-roster>.pdf`.
