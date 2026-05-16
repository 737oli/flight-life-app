# Issue 006: Stable Schedule DTO And Next-7-Days API

## Goal

Expose a backend schedule API that returns every day in the next 7 days using a stable project-owned DTO.

## Why

The frontend currently uses mock models. It needs a stable backend contract before Home can render real parsed data.

## Scope

- Define schedule DTOs for:
  - calendar day;
  - off day;
  - flight duty;
  - other duty;
  - flight leg;
  - ground/taxi/rest/hotel context where available.
- Add endpoint for next 7 days.
- Return empty/missing-roster state when no roster is imported.
- Include import metadata needed by frontend.
- Add tests for DTO shape and date coverage.

## Out Of Scope

- Do not add live operations data yet.
- Do not implement frontend consumption yet.
- Do not implement full roster calendar view.

## Acceptance Criteria

- API returns exactly 7 calendar days for Home.
- Off days are explicit.
- Unknown duties are explicit.
- Response contains only sanitized/project-owned fields.

## Validation

- Run schedule API tests.

