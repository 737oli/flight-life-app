# Roster Import History QA Checklist

Use this checklist for the Settings import-history and source-PDF cleanup milestone. Do not commit screenshots, real roster PDFs, parsed real roster output, local source paths, or private filenames.

## Setup

- Run `python -m alembic upgrade head` in `flight-life-app-server/` before starting the backend, especially when reusing an existing local SQLite database.
- Start the backend on the project port: `uvicorn main:app --reload --host 0.0.0.0 --port 8010`.
- Start the frontend with `npm run web`, `npm run start`, or the relevant Expo target.
- Use a local ignored roster PDF only for manual QA.

## Backend API

- `GET /rosters/imports?limit=10` returns successful imports only.
- `current_import` is the latest successful import.
- `imports` is newest first and defaults to 10 items.
- The response includes `has_preserved_days_outside_current_period`.
- No response field exposes `stored_pdf_path` or any other local filesystem path.
- Warning preview returns at most 5 raw warning strings plus `remaining_warning_count`.
- `DELETE /rosters/imports/{import_id}/source-pdf` deletes only the retained PDF source and keeps parsed schedule data available.
- Repeating the delete request or deleting an already-missing file returns a successful deleted/no-source state rather than failing.

## Settings UI

- The Roster Import section shows an Import Times control with Local and UTC options.
- Local timestamps are labeled `Local`; UTC timestamps are labeled `UTC`.
- The timestamp preference affects roster import history only.
- The Current roster card appears above Recent Imports when a successful import exists.
- The Current roster card shows filename, import timestamp, roster period, parsed days/flights, parser warning count, inserted/updated/unchanged counts, source PDF privacy state, and a View Calendar action.
- If preserved schedule days exist outside the current import period, Settings shows a quiet preserved-days note.
- Recent Imports shows successful imports only.
- Expanding an import shows source PDF privacy state, flight-duty-days-without-legs count, decisions marked review count, and warning preview.
- If there are more than 5 warnings, the UI shows `+N more`; it does not provide a full warning browser in this milestone.

## Source PDF Cleanup

- Delete Source PDF appears on the Current roster card and expanded history details only when the backend reports `can_delete`.
- Pressing Delete Source PDF opens a simple confirmation prompt.
- Confirming deletion changes the import card to `Source PDF deleted`.
- The import card remains visible after deletion.
- Calendar/Home schedule data remains available after deletion.
- There is no undo and no restore behavior.

## Unavailable State

- Stop or block the backend and open Settings.
- Import history shows a small inline warning with Retry.
- Backend connection checks, preferences display, and the roster upload button remain usable independently.

## Regression Checks

- Re-importing the same roster should still produce unchanged date counts when no parsed data changed.
- Failed imports must not appear in import history for this milestone.
- The frontend must not store or display backend filesystem paths.
- The feature must not introduce roster rollback, old-roster preview, cloud sync, or file-manager behavior.
