# Issue 008: Settings Roster Import UI

## Goal

Add the mobile Settings flow for selecting and uploading a roster PDF.

## Why

The user should not manually place PDFs on the backend. Settings is the control panel for import and backend state.

## Scope

- Add or complete Settings screen.
- Add roster PDF picker/upload action.
- Send selected PDF to backend upload endpoint.
- Display import loading, success, warnings, and failure states.
- Show roster period, source filename, counts, and "view schedule" action after import.

## Out Of Scope

- Do not build a full file manager.
- Do not add delete-PDF UI.
- Do not implement full calendar view.

## Acceptance Criteria

- User can upload a roster PDF from Settings.
- Import summary is visible and understandable.
- Core parse failure is clearly shown and does not imply data changed.
- User can return to Home after successful import.

## Validation

- Run frontend lint.
- Manually test upload against local backend with an ignored private PDF.

