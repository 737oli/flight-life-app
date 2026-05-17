# Issue 018: Improve Flight Leg Extraction And Day Assignment

## Status

Done.

## Goal

Make `flights_parser` extract flight legs for real `Fld` days reliably enough for the first dashboard milestone.

## Why

Plain sequential text regex parsing missed flight legs and could assign route fields incorrectly when the PDF text stream did not match the visual row layout.

## Scope

- Keep the existing parser output shape consumed by `parser_adapter`.
- Add day anchors from flight-detail labels as well as `C/I` blocks.
- Parse bounded flight segments instead of scanning arbitrarily far through the text stream.
- Support both time-first and route-first flight-row layouts.
- Add layout-aware row extraction as a fallback/overlay when text extraction is sparse.
- Preserve warnings for genuinely unknown or missing legs.

## Out Of Scope

- Do not require perfect parsing before frontend work resumes.
- Do not add live operations data.
- Do not redesign the parser adapter contract.

## Acceptance Criteria

- Synthetic fixtures from Issue 017 pass.
- Counts-only private QA shows flight legs increase from the earlier baseline of 3.
- Counts-only private QA shows fewer flight-duty days without legs.
- Existing backend tests stay green.

## Validation

- Run parser characterization tests.
- Run full backend `pytest`.
- Run counts-only local QA against `rosters/<local-private-roster>.pdf`.
