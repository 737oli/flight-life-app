# Issue 039: Roster Import History Docs And QA Checklist

## Status

Done.

## Milestone

Roster Import History And Privacy Controls

## Goal

Document the import-history and source-PDF cleanup behavior after implementation, and create a focused QA checklist.

## Why

The feature touches privacy-sensitive local files, schedule trust, and Settings UX. Future agents need exact rules so they do not accidentally turn import history into rollback, cloud sync, or file-manager behavior.

## Scope

- Update shared project docs after Issues 037 and 038 are implemented.
- Document:
  - current roster equals latest successful import;
  - import history is read-only audit/history;
  - failed imports are not persisted in history for this milestone;
  - source PDF deletion is irreversible;
  - deleting a source PDF keeps parsed roster data and import metadata;
  - file paths are never exposed to the frontend;
  - timestamp display preference is frontend-only and import-history-only.
- Add or update README guidance for source PDF cleanup.
- Add a manual QA checklist for:
  - current roster card;
  - recent imports;
  - timestamp display modes;
  - preserved-days note;
  - warning preview;
  - source PDF deletion;
  - repeated deletion;
  - backend unavailable import-history state.
- Sync shared docs into the frontend repo.

## Out Of Scope

- No implementation changes unless docs reveal a mismatch in Issues 037 or 038.
- No screenshots with real roster data.
- No real filenames, roster PDFs, source paths, or private parsed output.

## Acceptance Criteria

- Shared docs accurately describe the implemented behavior.
- Backend and frontend shared-doc copies are synchronized.
- QA checklist is actionable without exposing private roster data.
- Kanban marks Issues 037 through 039 according to actual completion state.

## Validation

- Run `scripts/sync-shared-docs.sh`.
- Check git status in both child repos.
- Commit and push docs changes in both repos.

## Dependencies

- Depends on 037 and 038.
