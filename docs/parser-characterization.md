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
- After layout reliability follow-up: the same ignored local roster parsed 24 flight legs, 0 flight-duty days without legs, 0 parser warnings, and 0 same-station flight legs in the counts-only check.
- Batch QA against seven normal ignored IDP roster PDFs from April-May 2026 parsed 28 days each, 0 flight-duty days without legs, 0 parser warnings, and 0 same-station flight legs.
- One supplied `duty-plan` PDF was rejected before import because its header period/date structure did not match the 28-day roster table shape.

## Known Limitations To Revisit

- The duty table model stores weekday plus day-of-month, but not the resolved absolute roster date.
- Duty table token recognition is currently narrow: `Off`, `Fld`, and `Sby`.
- Flight number recognition is currently KLM-specific.
- Aircraft code recognition covers Embraer-style `E##`/`E#A` tokens and three-digit numeric codes.
- Header parse failure is permissive: it returns the raw line with empty structured fields instead of a parser warning object.
- Some future roster layouts may still have no extracted legs. Import is allowed when the roster period and duty table are valid, but the import summary surfaces `flight_duty_days_without_legs` and `parser_warning_count`.
- The parser prefers layout extraction over pdfminer text extraction when layout has at least as much flight-leg coverage, because column-order text streams can combine unrelated roster columns into false text-only legs.
- Taxi derivation should still be treated as provisional and revisited with sanitized fixtures before later decision logic depends on it.
