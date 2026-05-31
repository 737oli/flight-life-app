# Milestones History

This file keeps completed milestone context out of the active kanban while preserving discoverability for future planning.

## Completed Milestones

### First Milestone: Import And 7-Day Dashboard

Issues: `001` through `010`, plus parser hardening issues `017` through `020`.

Outcome: from a clean local setup, the user can upload a roster PDF from Settings, see a trustworthy import summary, and view the next 7 days on Home from parsed backend data while preserving data outside the imported roster period.

### Parser Hardening Mini-Milestone

Issues: `017` through `020`.

Outcome: parser gaps found with a private real roster were turned into sanitized fixtures, flight-leg extraction was improved, import summaries expose completeness warnings, and the systematic missing-first-legs issue was fixed without committing private roster data.

### Second Milestone: Preferences And Decisions

Issues: `011` and `012`.

Outcome: backend-owned preferences and deterministic stay-vs-home decisions were added with reasoning, missing-input review states, and manual override persistence.

### Third Milestone: Live Operations Window

Issues: `013` through `015`.

Outcome: backend-only AF/KLM FlightStatus enrichment was added for the 90-minute operations window, and the frontend shows compact operations chips plus a detail panel without replacing roster facts.

### Fourth Milestone: Hardening And Documentation

Issues: `016`, `021`, `022`, and `024` are done. Issue `023` remains manual validation.

Outcome: local/Pi deployment docs were refreshed, Expo route/package warnings were addressed, and post-flight operations context plus departure superscript behavior were fixed. Real Pi/iPhone Tailscale validation remains open.

### Fifth Milestone: Decision Experience

Issues: `025` through `028`.

Outcome: frontend decisions moved from mock UI to backend-driven stay-vs-home data, manual override actions were made reliable, and Home now places decision prompts under the relevant AMS-ending duty day.

### Sixth Milestone: Calendar And AI Decision Context

Issues: `029` through `036`.

Outcome: the app gained a backend date-range schedule endpoint, a mobile calendar agenda, backend-only TomTom traffic context, Open-Meteo weather summaries, compact decision context, an on-demand OpenAI advisor endpoint, and an AI advisor panel inside decision panes.

### Seventh Milestone: Roster Import History And Privacy Controls

Issues: `037` through `039`.

Outcome: Settings now shows the current roster import, recent successful import history, parser warning signal, preserved-days context, timestamp display preference, and irreversible source-PDF cleanup controls.

### Eighth Milestone: Documentation Operating Model And Test Foundation

Issues: `040` and `041`.

Outcome: the docs now have a short current-status entry point, active planning is separated from completed milestone history, API endpoint ownership and frontend consumers are indexed, shared-docs freshness checks are documented, and the frontend has a Jest/ts-jest presenter-test foundation for DTO-to-render-model behavior.

### Ninth Milestone: Operational Readiness Diagnostics

Issues: `042` and `043`.

Outcome: the backend exposes privacy-safe operational provider readiness through `/system/readiness`, and Settings shows a compact provider readiness panel for AF/KLM, TomTom, Open-Meteo, and OpenAI without exposing secrets, coordinates, paths, or raw provider payloads.

### Tenth Milestone: Frontend Maintenance And API Boundary Tests

Issues: `044` and `045`.

Outcome: the frontend lint baseline is clean, and the backend API client has deterministic tests for backend URL normalization, readiness success/error handling, and backend-unavailable health fallback behavior.

### Eleventh Milestone: Roster Import Reliability

Issues: `046` through `048`.

Outcome: remaining missing flight legs from ignored local rosters were traced to layout parser token handling for alphanumeric aircraft codes and split flight numbers. A later batch QA pass across normal April-May 2026 IDP roster PDFs added a guard against text-extraction false positives, confirmed zero flight-duty days without legs, zero parser warnings, and zero same-station false positives, and confirmed structurally incompatible PDFs reject before import. Settings source-PDF deletion now uses an in-app confirmation with API-client delete tests.

### Twelfth Milestone: Local Data Reset

Issues: `049`.

Outcome: Settings now includes a confirmed local-data reset for clearing stale cached schedule data, last-known operations snapshots, and the frontend-only import timestamp display preference without deleting backend roster data, source PDFs, decisions, preferences, or the API URL.

### Thirteenth Milestone: TomTom Commute In Decisions

Issues: `050`.

Outcome: the standard stay-vs-home decision endpoint now includes backend-owned TomTom route-specific commute reasoning when available, keeps configured commute assumptions as fallback, and the frontend decision reasoning text shows TomTom commute minutes instead of the fixed `60 min each way` line when both route estimates are available.

### Fourteenth Milestone: TomTom Time-Specific Routing

Issues: `051`.

Outcome: TomTom AMS-to-home commute estimates use `departAt` at the planned duty end, while home-to-AMS commute estimates use `arriveAt` at the next AMS-starting duty start. This keeps route estimates tied to the actual decision window instead of deriving the airport-bound query from the fallback commute assumption.

### Fifteenth Milestone: Decisions Full Roster Horizon

Issues: `052`.

Outcome: the Decisions tab now uses the current import metadata to fetch the current/future imported roster period through the date-range schedule endpoint, then shows all upcoming AMS-ending stay-vs-home decision candidates instead of only the next 7 days. Home remains on the 7-day horizon.

## Historical Issue Index

Detailed issue drafts and implementation records live in `docs/issues/`.

Completed implementation issues:

- `001` Backend test harness and project hygiene.
- `002` Parser characterization with private PDF and synthetic fixtures.
- `003` SQLite persistence foundation with SQLAlchemy and Alembic.
- `004` Roster upload endpoint with atomic parse validation.
- `005` Date-scoped roster import merge and import summary.
- `006` Stable schedule DTO and next-7-days API.
- `007` Frontend backend configuration and connection status.
- `008` Settings roster import UI.
- `009` Home 7-day dashboard from backend data with fallback cache.
- `010` Raspberry Pi Docker Compose backend deployment.
- `011` Backend preferences model and Settings integration.
- `012` Deterministic stay-vs-home decision engine.
- `013` AF/KLM FlightStatus backend client.
- `014` 90-minute operations enrichment API.
- `015` Frontend operations chips and detail panel.
- `016` README and deployment documentation refresh.
- `017` Real roster parser QA and sanitized fixture capture.
- `018` Improve flight leg extraction and day assignment.
- `019` Parser completeness validation and import summary refinement.
- `020` Fix parser omission of first two flight legs per duty day.
- `021` Frontend tab route cleanup.
- `022` Expo SDK compatibility refresh.
- `024` Operations data retention and departure superscript QA.
- `025` Frontend stay-vs-home decision integration.
- `026` Home next decision summary.
- `027` Decision manual override action reliability.
- `028` Home inline AMS decision placement.
- `029` Schedule date-range API.
- `030` Mobile calendar agenda tab.
- `031` TomTom traffic provider foundation.
- `032` Decision context builder for advisor data.
- `033` OpenAI structured decision advisor endpoint.
- `034` AI advisor panel in decision detail pane.
- `035` Open-Meteo weather context for decisions.
- `036` Document calendar and AI decision architecture.
- `037` Backend import history and source PDF cleanup API.
- `038` Settings current roster and import history UI.
- `039` Roster import history docs and QA checklist.
- `040` Shared docs operating model refresh.
- `041` Frontend behavior test foundation.
- `042` Backend operational readiness endpoint.
- `043` Settings operational readiness panel.
- `044` Frontend lint warning cleanup.
- `045` Frontend backend API client tests.
- `046` Roster parser layout reliability.
- `047` Settings source PDF delete action reliability.
- `048` Real roster batch QA and text false positive guard.
- `049` Settings local data reset.
- `050` TomTom commute in Decisions.
- `051` TomTom time-specific routing.
- `052` Decisions full roster horizon.

Manual validation issue:

- `023` Tailscale Raspberry Pi smoke test.
