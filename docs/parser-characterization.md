# Parser Characterization Notes

These notes describe the current parser behavior before upload/import persistence changes.

## Fixture Rules

- Committed automated tests use sanitized synthetic fixtures only.
- Real roster PDFs may be used locally from `rosters/`, but the PDFs and parsed outputs stay ignored.
- If a real PDF reveals a parser edge case, reproduce the structure with fake text/layout data before adding a test.

## Current Characterized Behavior

- `header_parser` extracts the standard "Individual duty plan" line into name, system, printed-by, printed-at, and page fields.
- `duty_table_parser` maps a 28-column visual duty table into `DutyDay` rows.
- `flights_parser` recognizes KLM-style flight legs, assigns legs to day windows anchored by `C/I` blocks, derives hotel-stay duration, derives taxi-to-airport and taxi-to-hotel durations, and resolves absolute datetimes from a `Period:` header where possible.

## Known Limitations To Revisit

- The duty table model stores weekday plus day-of-month, but not the resolved absolute roster date.
- Duty table token recognition is currently narrow: `Off`, `Fld`, and `Sby`.
- Flight number recognition is currently KLM-specific.
- Aircraft code recognition is currently narrow: Embraer-style `E##` or three-digit numeric codes.
- Header parse failure is permissive: it returns the raw line with empty structured fields instead of a parser warning object.
- Counts-only local smoke checks on ignored private PDFs confirm the parser executes, but taxi derivation did not appear on those local inputs and should be revisited with sanitized fixtures before import behavior depends on it.
