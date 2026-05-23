# Issue 041: Frontend Behavior Test Foundation

## Status

Done.

## Milestone

Documentation Operating Model And Test Foundation

## Goal

Introduce frontend behavior test tooling and cover the riskiest presentation mappings so future UI changes can be checked without relying only on manual browser smoke tests.

## Why

The frontend now owns Home, Settings, Calendar, operations panels, decision panes, and import-history presentation. TypeScript and lint catch syntax and style issues, but they do not prove that backend DTOs still map into trustworthy mobile UI states.

## Scope

- Choose and document frontend test tooling for the Expo/React Native app.
- Prefer a minimal setup that works with the current Expo SDK and TypeScript stack.
- Add package scripts for focused frontend tests.
- Add first behavior tests around high-risk contract boundaries:
  - backend schedule DTO to Home render/model mapping;
  - Settings import-history/current-roster render/model mapping;
  - backend unavailable or empty-state behavior where practical.
- Keep tests deterministic and free of real roster data.
- Update frontend README and shared testing docs with the chosen command and first test targets.

## Out Of Scope

- No end-to-end device automation.
- No screenshot tests with real roster data.
- No broad visual regression suite.
- No test coverage target percentage gate yet.
- No backend changes unless a frontend contract gap is found and split into a separate issue.

## Acceptance Criteria

- Frontend has a runnable test command.
- At least one focused behavior test covers backend DTO-to-UI/render-model logic.
- Tests use synthetic data only.
- `npm run lint` still passes.
- TypeScript checks still pass.
- Documentation explains when to add frontend tests and how to run them.

## Validation

- Run the new frontend test command.
- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Run `git diff --check`.

## Dependencies

- Should follow Issue 040 if shared testing docs need to reference the final docs operating model.
