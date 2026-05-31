# Flight Life App Kanban

## Purpose

This kanban is the active planning surface. Completed milestone detail lives in [Milestones History](milestones-history.md), and current workspace state lives in [Current Status](../../CURRENT_STATUS.md).

Codex should implement only one issue at a time unless explicitly told otherwise.

## Global Constraints

- Do not commit real roster PDFs, parsed real roster output, runtime logs, screenshots containing private roster data, crew names, employee identifiers, exact home coordinates, or credentials.
- Use real roster PDFs only for local parser development and manual QA.
- Use sanitized synthetic fixtures for committed automated tests.
- The roster PDF is the planned source of truth.
- Live AF/KLM data is backend-only enrichment and must not silently reorder, hide, or replace planned roster data.
- Traffic, weather, and AI advisor data are decision context only and must not rewrite roster facts.
- OpenAI calls are on-demand only and must not store raw prompts or full transcripts permanently.
- Keep frontend and backend git state separate. The workspace root is not currently a git repository.
- Preserve user changes.
- Treat date, time, timezone, duty-period, rest-period, taxi, hotel-stay, and import merge logic as domain-sensitive.

## Active And Ready Issues

| Issue | Title | Type | Area | Status | Blocked by |
| --- | --- | --- | --- | --- | --- |
| 023 | Tailscale Raspberry Pi smoke test | human-in-the-loop | backend, deployment | Needs manual validation | 010 |

## Current Milestone

No active implementation milestone is selected.

The most recent Decisions full roster horizon follow-up is complete. Its historical detail lives in [Milestones History](milestones-history.md).

## Next Planning Candidates

- Run `023` when the Raspberry Pi and iPhone/Tailscale setup is available.
- Choose the next product milestone.
- Add new ready issues before continuing implementation work.
- Use Settings operational readiness before manual provider checks.
- When adding or changing frontend DTO presentation behavior, add or update presenter tests before changing related UI screens.
- When changing frontend backend API calls, add or update API-client tests with mocked network/AsyncStorage behavior.
- When a new real roster exposes a parser gap, reproduce the shape with sanitized parser fixtures before committing the fix.

## Dependency Notes

- `023` remains manual validation and should run when the Raspberry Pi and iPhone/Tailscale setup is available.
- New backend DTO changes should update [API Contracts](api-contracts.md), backend tests, frontend API types, and frontend presenter tests.

## Completed Work

Completed milestone summaries and historical issue indexes live in [Milestones History](milestones-history.md).

Issue drafts and implementation records live in [Issue Drafts](../issues/).
