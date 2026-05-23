# Issue 040: Shared Docs Operating Model Refresh

## Status

Ready.

## Milestone

Documentation Operating Model And Test Foundation

## Goal

Make the project documentation easier to maintain by separating current status, historical issues, active planning, API contracts, and docs freshness checks.

## Why

The shared docs now contain useful history, but Codex and Copilot need a shorter current-state entry point. Without a clear operating model, stale milestone language and completed issue detail will keep leaking into future planning.

## Scope

- Add a canonical `CURRENT_STATUS.md` in the shared docs set.
- Keep `CURRENT_STATUS.md` short and current:
  - active milestone;
  - completed milestone summary;
  - open/manual validation items;
  - local ports and run commands;
  - current known risks;
  - next recommended issue order.
- Update `PROJECT_CONTEXT.md` and `AGENTS.md` to point agents to `CURRENT_STATUS.md` first for current state.
- Add a docs freshness checklist to `docs/ai/shared-docs-workflow.md`, including the stale-text scan command used after milestone completion.
- Add `docs/product/api-contracts.md` with the current backend endpoints, source-of-truth rule, frontend consumer, and storage/privacy notes.
- Split or restructure planning docs so `flight-life-app-kanban.md` is focused on active/next work while completed milestone detail is moved into a history section or separate `milestones-history.md`.
- Improve `docs/issues/README.md` so completed, active, ready, and manual-validation issues are easier to distinguish.
- Sync shared docs into the frontend repo.

## Out Of Scope

- No behavior changes.
- No frontend test tooling.
- No new product features.
- No deletion of historical issue drafts unless the new index clearly preserves discoverability.

## Acceptance Criteria

- A future agent can find current project state without reading the full kanban.
- Active/ready work is clearly separated from completed historical work.
- API endpoint ownership and frontend consumers are documented in one place.
- Shared docs workflow includes an explicit stale-text scan.
- Shared docs are synchronized across backend and frontend repos.
- GitHub issue references and local issue draft links remain valid.

## Validation

- Run `scripts/sync-shared-docs.sh`.
- Run the documented stale-text scan.
- Run `git diff --check` in both child repos.
- Confirm both child repos contain the same shared docs.

## Dependencies

- None.
