# Issue 046: Roster Parser Layout Reliability

## Status

Done.

## Milestone

Roster Import Reliability

## Goal

Fix remaining missing flight legs caused by known roster layout token shapes.

## Why

The roster PDF is the planned source of truth. If import succeeds but flight-duty legs are missing, Home, Calendar, operations enrichment, and decisions become less trustworthy.

## Scope

- Use ignored local roster PDFs only for counts-only debugging.
- Add sanitized parser tests for:
  - alphanumeric Embraer aircraft code tokens such as `E7W`;
  - flight numbers split across adjacent numeric layout tokens after `KL`.
- Update layout flight parsing while preserving the existing parser adapter and schedule DTO shape.
- Keep import warnings for genuinely incomplete days.
- Update parser characterization notes with counts-only QA results.

## Out Of Scope

- No real roster PDFs, parsed private JSON, route lists, screenshots, crew data, or identifiers committed.
- No frontend schedule redesign.
- No live operations changes.

## Acceptance Criteria

- Synthetic parser tests cover the recovered layout shapes.
- Counts-only local QA against ignored roster PDFs shows the affected missing-leg pattern is resolved.
- Import summary warning counts remain accurate.
- Full backend tests pass.

## Validation

- `.venv/bin/python -m pytest tests/test_parser_characterization.py tests/test_parser_adapter.py tests/test_import_and_schedule.py tests/test_roster_import_history.py`
- `.venv/bin/python -m pytest`
- Counts-only local QA against ignored `rosters/` PDFs.

## GitHub

- Backend issue to be created/closed after implementation.
