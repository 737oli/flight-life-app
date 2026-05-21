# Issue 036: Document Calendar And AI Decision Architecture

## Status

Done.

## Goal

Update the shared project documentation for the calendar, traffic, weather, and AI advisor architecture.

## Why

The new milestone adds provider keys, privacy-sensitive home coordinates, external context gathering, OpenAI cost controls, and a new Calendar surface. These rules need to be explicit for future Codex/Copilot work.

## Scope

- Update canonical backend shared docs first.
- Add the Sixth Milestone issue graph for Issues 029 through 036.
- Document the core architecture decisions:
  - Calendar v1 is a mobile agenda, not a month grid.
  - Traffic v1 uses TomTom for AMS-home and home-AMS stay-vs-home routes.
  - Exact home coordinates are backend-only local config/database data and are never committed.
  - Weather is secondary context via Open-Meteo.
  - Backend gathers data; GPT interprets compact structured context.
  - GPT is on-demand only and cannot override deterministic backend recommendations.
  - AI responses use short-lived cache keyed by decision/context hash.
- Document required environment variables without real secrets.
- Run the shared-docs sync workflow into the frontend repo.

## Out Of Scope

- No implementation code unless needed to keep docs accurate.
- No real home coordinates, API keys, roster data, or private examples.

## Acceptance Criteria

- Shared docs describe the new milestone and decision architecture clearly.
- Backend and frontend repo copies of shared docs are synchronized.
- No secrets or private data are committed.
- Kanban includes Issues 029 through 036 and dependencies.

## Validation

- Run `flight-life-app-server/scripts/sync-shared-docs.sh`.
- Check git status in both child repos.
- Commit and push both repos when docs are updated.
