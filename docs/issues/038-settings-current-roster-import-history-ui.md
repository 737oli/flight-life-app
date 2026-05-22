# Issue 038: Settings Current Roster And Import History UI

## Status

Ready.

## Milestone

Roster Import History And Privacy Controls

## Goal

Show the current roster import and recent import history in Settings, including trust details and source-PDF cleanup actions.

## Why

The user should be able to verify which roster is active, whether warnings matter, and whether the private source PDF is still stored locally.

## Scope

- Add frontend API types and client support for `GET /rosters/imports?limit=10`.
- Add frontend API support for `DELETE /rosters/imports/{import_id}/source-pdf`.
- In Settings, inside the Roster Import section, add a frontend-only timestamp display preference:
  - default local phone time;
  - alternate UTC;
  - labels clearly show `Local` or `UTC`;
  - applies only to roster import history timestamps.
- Auto-refresh import history when Settings opens/focuses.
- Add a manual refresh action for import history.
- Show a prominent Current roster card above history with:
  - source filename;
  - import date/time using selected timestamp display;
  - roster period;
  - parsed days/flights;
  - inserted, updated, and unchanged date counts;
  - parser warning count;
  - source PDF privacy state;
  - `View calendar` action;
  - direct `Delete source PDF` action when available.
- Show a quiet note when `has_preserved_days_outside_current_period` is true.
- Show Recent imports list with compact rows:
  - filename;
  - import date/time;
  - roster period;
  - days/flights parsed;
  - warning count;
  - inserted, updated, and unchanged counts.
- Expanded import rows show:
  - first 5 raw warning strings and `+N more`;
  - flight-duty-days-without-legs count;
  - decisions marked needs review;
  - source PDF privacy state;
  - `Delete source PDF` action when available.
- Delete action requires a confirmation prompt: `Delete source PDF? Parsed roster data will remain.`
- After import success or source PDF deletion, refresh import history.
- Import history load errors appear as a small inline warning with retry.

## Out Of Scope

- No offline cache for import history.
- No restore, rollback, or old roster preview.
- No failed import history.
- No warning taxonomy or grouped warning browser.
- No global timestamp preference.

## Acceptance Criteria

- Settings clearly shows the latest successful import as the Current roster.
- Timestamp display can switch between clearly labeled Local and UTC values.
- Deleting a source PDF updates the UI to `Source PDF deleted` without removing the import card.
- Import history remains read-only audit/history.
- Existing roster upload flow still works.
- Inline import-history errors do not block backend connection checks, preferences, or roster upload.

## Validation

- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Manual Settings QA for current card, recent imports, expansion, timestamp toggle, warning preview, preserved-days note, delete confirmation, delete success, and inline error state.

## Dependencies

- Depends on 037.
