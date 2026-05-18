# Flight Life App Kanban

## Project Issue Graph

The next product increment is the first real vertical slice: upload a roster PDF from the mobile app, parse and persist it on the backend, merge it by roster date range, show a trustworthy import summary, and render the next 7 days on Home from backend data.

Codex should implement only one issue at a time unless explicitly told otherwise.

## Global Constraints

- Do not commit real roster PDFs, parsed real roster output, runtime logs, screenshots containing private roster data, crew names, employee identifiers, or credentials.
- Use real roster PDFs only for local parser development and manual QA.
- Use sanitized synthetic fixtures for committed automated tests.
- The roster PDF is the planned source of truth.
- Live AF/KLM data is backend-only enrichment and must not silently reorder, hide, or replace planned roster data.
- Keep frontend and backend git state separate. The workspace root is not currently a git repository.
- Preserve user changes.
- Treat date, time, timezone, duty-period, rest-period, taxi, hotel-stay, and import merge logic as domain-sensitive.

## Issue Table

| Issue | Title | Type | Area | Status | Blocked by |
| --- | --- | --- | --- | --- | --- |
| 001 | Backend test harness and project hygiene | AFK | backend | Done | none |
| 002 | Parser characterization with private PDF and synthetic fixtures | human-in-the-loop | backend | Done | 001 |
| 003 | SQLite persistence foundation with SQLAlchemy and Alembic | AFK | backend | Done | 001 |
| 004 | Roster upload endpoint with atomic parse validation | AFK | backend | Done | 002, 003 |
| 005 | Date-scoped roster import merge and import summary | AFK | backend | Done | 004 |
| 006 | Stable schedule DTO and next-7-days API | AFK | backend | Done | 005 |
| 007 | Frontend backend configuration and connection status | AFK | frontend | Done | none |
| 008 | Settings roster import UI | AFK | frontend | Done | none |
| 009 | Home 7-day dashboard from backend data with fallback cache | AFK | frontend | Done | none |
| 010 | Raspberry Pi Docker Compose backend deployment | AFK | backend, deployment | Done | none |
| 011 | Backend preferences model and Settings integration | AFK | both | Ready | none |
| 012 | Deterministic stay-vs-home decision engine | AFK | backend | Blocked | 005, 011 |
| 013 | AF/KLM FlightStatus backend client | human-in-the-loop | backend | Ready | none |
| 014 | 90-minute operations enrichment API | AFK | backend | Blocked | 013 |
| 015 | Frontend operations chips and detail panel | AFK | frontend | Blocked | 014, 009 |
| 016 | README and deployment documentation refresh | AFK | docs, both repos | Ready | none |
| 017 | Real roster parser QA and sanitized fixture capture | human-in-the-loop | backend | Done | 002 |
| 018 | Improve flight leg extraction and day assignment | AFK | backend | Done | 017 |
| 019 | Parser completeness validation and import summary refinement | AFK | backend | Done | 018 |
| 020 | Fix parser omission of first two flight legs per duty day | human-in-the-loop | backend | Done | 019 |
| 021 | Frontend tab route cleanup | AFK | frontend | Ready | none |
| 022 | Expo SDK compatibility refresh | AFK | frontend | Ready | none |
| 023 | Tailscale Raspberry Pi smoke test | human-in-the-loop | backend, deployment | Ready | 010 |

## Dependency Graph

- 001 creates the testing and hygiene base for backend work.
- 002 characterizes current parser behavior before risky parser changes and needs the backend test harness first.
- 003 creates durable local persistence and schema migrations.
- 004 depends on parser characterization and persistence because upload must validate before storing app state.
- 005 adds the core import behavior: date-scoped upsert, preservation outside imported period, and summary counts.
- 006 exposes the stable schedule contract needed by the frontend.
- 007 can proceed independently so the frontend can target Pi/Tailscale and local dev URLs.
- 017 turns real-roster parser failures into sanitized repeatable fixtures and counts-only notes.
- 018 improves flight-leg extraction and day assignment while preserving the parser adapter shape.
- 019 makes parser completeness visible in import summaries and preserves schedule output for incomplete flight duties.
- 020 fixes the newly observed systematic omission where the first two flights of each duty day appear to be missing.
- 008 depends on frontend backend configuration, parser-completeness reporting, and the missing-first-legs parser fix.
- 009 depends on the schedule API, frontend backend configuration, parser-completeness reporting, and the missing-first-legs parser fix.
- 010 can start after the backend test harness exists because Pi/Tailscale deployment is an early enabler for operational-window testing. It should add the basic Compose shape first and evolve volumes as persistence lands.
- 011 depends on persistence and frontend settings structure.
- 012 depends on imported roster data and preferences.
- 013 needs human input for AF/KLM credentials and official response shape.
- 014 wraps live data into the project-owned 90-minute operations contract.
- 015 consumes that operations contract in the mobile UI.
- 016 documents the actual deployable shape after Compose exists.
- 021 cleans up Expo Router warnings found during first-milestone QA.
- 022 addresses Expo SDK package compatibility warnings found during first-milestone QA.
- 023 validates the Pi/Tailscale backend path after local Docker Compose is working.

## First Milestone: Import And 7-Day Dashboard

Issues 001 through 010 plus parser hardening issues 017 through 020.

Goal: from a clean local setup, the user can upload a roster PDF from Settings, see a trustworthy import summary, and view the next 7 days on Home from parsed backend data while preserving data outside the imported roster period.

Recommended order:

1. 001 Backend test harness and project hygiene.
2. 007 Frontend backend configuration and connection status.
3. 010 Raspberry Pi Docker Compose backend deployment.
4. 002 Parser characterization with private PDF and synthetic fixtures.
5. 003 SQLite persistence foundation with SQLAlchemy and Alembic.
6. 004 Roster upload endpoint with atomic parse validation.
7. 005 Date-scoped roster import merge and import summary.
8. 006 Stable schedule DTO and next-7-days API.
9. 017 Real roster parser QA and sanitized fixture capture.
10. 018 Improve flight leg extraction and day assignment.
11. 019 Parser completeness validation and import summary refinement.
12. 020 Fix parser omission of first two flight legs per duty day.
13. 008 Settings roster import UI.
14. 009 Home 7-day dashboard from backend data with fallback cache.

## Parser Hardening Mini-Milestone

Issues 017 through 020.

Goal: make the parser useful enough for Settings upload and Home backend rendering by reducing missed flight legs, documenting counts-only private QA, making remaining parser uncertainty explicit in import summaries, and fixing systematic first-leg omissions.

## Second Milestone: Preferences And Decisions

Issues 011 and 012.

Goal: add backend-owned preferences and the first deterministic stay-vs-home recommendation with "needs review" handling.

## Third Milestone: Live Operations Window

Issues 013 through 015.

Goal: enrich only flights within 90 minutes using backend-owned AF/KLM FlightStatus integration and show compact operations data in the mobile app.

## Fourth Milestone: Hardening And Documentation

Issues 016 and 021 through 023.

Goal: make the Pi/Tailscale setup repeatable, clean up development warnings, and document remaining gaps before broader operational use.

## Implementation Rule

Implement one issue at a time. Prefer vertical slices that produce a visible or testable outcome. If manual QA with a real roster PDF reveals parser gaps, create sanitized synthetic fixtures and follow-up issues rather than committing private data.
