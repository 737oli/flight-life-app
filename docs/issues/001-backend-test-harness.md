# Issue 001: Backend Test Harness And Project Hygiene

## Goal

Create the backend testing foundation needed before parser, import, persistence, and API work.

## Why

The backend currently has parser logic but no committed test suite. The first implementation milestone depends on trustworthy parser and import behavior, so the backend needs deterministic feedback loops first.

## Scope

- Add a backend test structure.
- Add pytest configuration if needed.
- Add minimal tests for current FastAPI health/root behavior.
- Add a place for synthetic parser fixtures.
- Keep real roster PDFs ignored and out of tests.
- Remove unused imports or obvious startup noise only if needed for clean test execution.

## Out Of Scope

- Do not rewrite parser behavior.
- Do not add persistence yet.
- Do not add upload API yet.
- Do not commit real PDFs or parsed real roster output.

## Acceptance Criteria

- Backend tests can be run with one documented command.
- Tests are fast, deterministic, and independent.
- Synthetic fixture location exists.
- Real roster storage remains ignored.

## Validation

- Run the new backend test command.
- Run `git status --short --ignored` and confirm private PDFs/logs remain ignored.

