# Issue 047: Settings Source PDF Delete Action Reliability

## Status

Done.

## Milestone

Roster Import Reliability

## Goal

Make the Settings source-PDF delete action work reliably and visibly across Expo targets.

## Why

The delete button appeared to do nothing because the flow depended on a native `Alert.alert` destructive callback. Source-PDF cleanup is a privacy/trust control, so it needs a deterministic UI path and clear error surface.

## Scope

- Replace the native alert confirmation with an in-app confirmation panel.
- Keep the existing backend delete endpoint and import-history refresh behavior.
- Show the selected import filename and irreversible warning before deletion.
- Add frontend API-client tests for source-PDF delete success and typed error behavior.

## Out Of Scope

- No import history rollback.
- No source PDF restore/undo.
- No file manager.
- No backend endpoint contract change.

## Acceptance Criteria

- Pressing `Delete Source PDF` shows an in-app confirmation.
- Pressing confirmation calls `DELETE /rosters/imports/{import_id}/source-pdf`.
- Successful deletion refreshes import history and clears the confirmation.
- Failed deletion surfaces an import-history error.
- Frontend tests, typecheck, and lint pass.

## Validation

- `npm run test`
- `npm run typecheck`
- `npm run lint`

## GitHub

- Frontend issue to be created/closed after implementation.
