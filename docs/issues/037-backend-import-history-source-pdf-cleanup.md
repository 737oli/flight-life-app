# Issue 037: Backend Import History And Source PDF Cleanup API

## Status

Ready.

## Milestone

Roster Import History And Privacy Controls

## Goal

Expose the current roster import, recent successful import history, and source-PDF cleanup controls from the backend.

## Why

The user needs to trust which roster import produced the current schedule and needs a privacy-safe way to delete retained source PDFs without losing parsed roster data.

## Scope

- Add `stored_pdf_deleted_at` to `roster_imports` with Alembic.
- Add `GET /rosters/imports?limit=10`.
- Return:
  - `status`;
  - `current_import`;
  - `imports`;
  - `has_preserved_days_outside_current_period`.
- Define current import as the latest successful import.
- Include successful imports only, newest first.
- Default to the latest 10 imports and cap requested limits at 50.
- Include each import's:
  - id;
  - source filename;
  - created timestamp;
  - roster period;
  - parsed days and flights;
  - inserted, updated, and unchanged date counts;
  - parser warning count;
  - first 5 raw warning strings and remaining warning count;
  - flight-duty-days-without-legs count;
  - decisions marked needs review;
  - source PDF privacy state.
- Do not expose stored filesystem paths.
- Add `DELETE /rosters/imports/{import_id}/source-pdf`.
- Delete the source PDF immediately, clear `stored_pdf_path`, and set `stored_pdf_deleted_at`.
- Treat an already-missing file as successfully deleted and mark it deleted.
- Preserve parsed roster days, import metadata, and manual decisions.

## Out Of Scope

- No failed/rejected import history.
- No rollback, restore, or old-roster preview.
- No frontend UI.
- No automatic PDF deletion after parse.
- No full warning taxonomy or grouped warning browser.

## Acceptance Criteria

- Import history response identifies the latest successful import as current.
- Response includes preserved-days-outside-current-period status from backend persistence.
- Response never exposes source PDF paths.
- Source PDF states distinguish stored locally, deleted, and no source PDF stored.
- Deleting a source PDF is idempotent and irreversible.
- Parsed schedule data remains available after source PDF deletion.

## Validation

- Add focused backend tests for import history ordering, default limit, limit cap, preserved-days flag, source PDF states, path privacy, successful delete, repeated delete, missing file delete, and unknown import 404.
- Run full backend `pytest`.

## Dependencies

- Depends on existing roster import persistence.
