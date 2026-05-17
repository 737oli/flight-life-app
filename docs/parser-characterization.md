# Parser Characterization Notes

These notes describe the current parser behavior and parser-hardening follow-ups.

## Fixture Rules

- Committed automated tests use sanitized synthetic fixtures only.
- Real roster PDFs may be used locally from `rosters/`, but the PDFs and parsed outputs stay ignored.
- If a real PDF reveals a parser edge case, reproduce the structure with fake text/layout data before adding a test.

## Current Characterized Behavior

- `header_parser` extracts the standard "Individual duty plan" line into name, system, printed-by, printed-at, and page fields.
- `duty_table_parser` maps a 28-column visual duty table into `DutyDay` rows.
- `flights_parser` recognizes KLM-style flight legs, assigns legs to day windows anchored by flight-detail labels and `C/I` blocks, supplements plain text extraction with layout-aware row extraction when needed, derives hotel-stay duration, derives taxi-to-airport and taxi-to-hotel durations, and resolves absolute datetimes from a `Period:` header where possible.

## Counts-Only Private Roster QA

The ignored local roster PDF was used only for counts and parser-shape validation. No private roster text, parsed JSON, route list, crew data, or screenshots were committed.

- Before parser hardening: 28 duty days parsed, 3 flight legs parsed, 7 flight-duty days without legs, and at least one same-station route shape observed.
- After parser hardening: 28 duty days parsed, 13 flight legs parsed, 2 flight-duty days without legs, and 0 same-station flight legs observed in the counts-only check.

## Known Limitations To Revisit

- The duty table model stores weekday plus day-of-month, but not the resolved absolute roster date.
- Duty table token recognition is currently narrow: `Off`, `Fld`, and `Sby`.
- Flight number recognition is currently KLM-specific.
- Aircraft code recognition is currently narrow: Embraer-style `E##` or three-digit numeric codes.
- Header parse failure is permissive: it returns the raw line with empty structured fields instead of a parser warning object.
- Some flight-duty days can still have no extracted legs. Import is allowed when the roster period and duty table are valid, but the import summary surfaces `flight_duty_days_without_legs` and `parser_warning_count`.
- Taxi derivation should still be treated as provisional and revisited with sanitized fixtures before later decision logic depends on it.
