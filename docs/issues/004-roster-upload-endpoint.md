# Issue 004: Roster Upload Endpoint With Atomic Parse Validation

## Goal

Add a FastAPI endpoint that accepts a roster PDF upload, stores it locally, parses it, validates core data, and returns a parse result without corrupting existing app state.

## Why

The user wants upload from the mobile app rather than manually placing PDFs on the backend.

## Scope

- Add PDF upload endpoint.
- Store uploaded source PDFs under ignored runtime storage such as `rosters/`.
- Run parser against the uploaded file.
- Validate core data:
  - roster period detected;
  - duty table parsed;
  - non-off flight duty days have enough timing and route information;
  - dates resolve to real calendar dates.
- Return structured success/warning/error response.
- Reject failed core parses without applying database changes.

## Out Of Scope

- Do not build frontend upload UI.
- Do not implement date-scoped merge yet.
- Do not add public authentication.

## Acceptance Criteria

- Endpoint accepts a PDF upload.
- Core parse failures return errors and leave existing data unchanged.
- Non-core parser warnings are returned clearly.
- Uploaded real PDFs remain ignored.

## Validation

- Run upload endpoint tests with synthetic PDF or file fixture.
- Manually upload a local private PDF and summarize outcome without committing private output.

