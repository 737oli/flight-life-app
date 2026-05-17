# Issue 020: Fix Parser Omission Of First Two Flight Legs Per Duty Day

## Status

Done.

## Goal

Fix the parser behavior where the first two flights of each flight-duty day appear to be missing from the parsed schedule.

## Why

The roster PDF is the source of truth. If the parsed schedule systematically omits the first two legs of a duty day, the dashboard will give a misleading operational picture even when the import succeeds.

## Scope

- Use the ignored local real roster only for counts and structural debugging.
- Identify whether the missing first legs are lost during layout row extraction, day assignment, duplicate filtering, or parser adapter normalization.
- Add sanitized synthetic fixtures that reproduce a duty day with early legs before the currently parsed legs.
- Ensure all legs for a duty day are preserved in sequence, including the first two.
- Keep the existing parser adapter and schedule DTO shape stable.
- Keep import warnings for genuinely incomplete days.

## Out Of Scope

- Do not commit real roster PDFs.
- Do not commit direct parsed output, route lists, screenshots, crew data, or private roster text.
- Do not build frontend upload or Home UI in this issue.
- Do not add live operations enrichment.

## Acceptance Criteria

- A synthetic fixture fails before the fix and passes after the fix for a duty day whose first two legs were previously omitted.
- Parsed flight-leg sequences include the first two legs for each affected duty day.
- Counts-only local QA against the ignored private roster shows the missing-first-two pattern is resolved.
- `flight_duty_days_without_legs` and `parser_warning_count` remain accurate.
- Full backend `pytest` stays green.

## Validation

- Run focused parser characterization tests.
- Run parser adapter and import summary tests.
- Run counts-only local QA against `rosters/<local-private-roster>.pdf`.
- Run full backend `pytest`.
