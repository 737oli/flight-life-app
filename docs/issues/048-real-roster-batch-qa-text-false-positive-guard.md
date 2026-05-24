# Issue 048: Real Roster Batch QA And Text False Positive Guard

## Status

Done.

## Milestone

Roster Import Reliability

## Goal

Run counts-only parser/import QA against a batch of ignored real roster PDFs and fix any trust-breaking parser false positives found.

## Why

Single-roster parser QA is not enough. Weekly roster layouts can expose parser edge cases, and false flight legs are as harmful as missing flight legs because they make non-flying duties look operational.

## Scope

- Test the supplied private PDFs directly from local storage without copying them into the repository.
- Report only counts and parser/import status.
- Add sanitized regression tests for any parser shape discovered.
- Prevent pdfminer column-order text extraction from adding false text-only legs when layout extraction has stronger coverage.
- Reject impossible HHMM values that can arise when aircraft codes are misread as times.

## Out Of Scope

- No real roster PDFs, parsed private JSON, route lists, screenshots, crew data, identifiers, or raw text committed.
- No UI changes.
- No live operations provider testing.

## Acceptance Criteria

- Normal IDP roster PDFs parse with zero flight-duty days without legs.
- Parser warnings remain zero for clean imports.
- Same-station false positives are removed.
- Structurally incompatible PDFs reject before import instead of corrupting data.
- Date-scoped import merge succeeds in a temp SQLite sequence.
- Full backend tests pass.

## Validation

- Counts-only parser QA across the supplied local PDFs.
- Temp SQLite sequential import QA across the normal IDP roster PDFs.
- `.venv/bin/python -m pytest tests/test_parser_characterization.py tests/test_parser_adapter.py tests/test_import_and_schedule.py`
- `.venv/bin/python -m pytest`

## GitHub

- Backend issue to be created/closed after implementation.
