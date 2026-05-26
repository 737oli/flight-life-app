# Project Context: Flight Life App

## Project Purpose

Flight Life App is a private, personal flight-duty companion for turning roster PDFs into a trustworthy operational dashboard. The implemented baseline uploads a roster PDF from the mobile app, parses it on the backend, persists the parsed schedule, and shows the next 7 days in the iPhone app.

The app is for one pilot/crew member first. It should be clean enough to evolve for another crew member later, but version 1 does not include accounts, multi-user support, public sharing, or a generic crew-market product.

## Current Workspace

This folder is a parent workspace, not a git repository. It contains two separate git repositories plus shared planning docs:

- `flight-life-app/` - Expo, React Native, Expo Router, TypeScript frontend.
- `flight-life-app-server/` - Python FastAPI backend plus NetLine/Crew roster PDF parser.
- `docs/` - shared project documentation and AI-agent workflow docs.
- `docs/ai/` - AI-agent standards and workflows.
- `docs/product/` - product, architecture, kanban, and planning documents.
- `docs/issues/` - independently grabbable issue drafts.

Shared project docs are committed into both child repositories so GitHub Copilot and repo-local tools can reference them. The backend repo copy is the canonical source for shared docs:

- `flight-life-app-server/AGENTS.md`
- `flight-life-app-server/CURRENT_STATUS.md`
- `flight-life-app-server/PROJECT_CONTEXT.md`
- `flight-life-app-server/docs/`

When shared docs change, edit the backend repo copy, run `flight-life-app-server/scripts/sync-shared-docs.sh`, then commit and push the resulting docs changes in both child repositories.

## Current Status Entry Point

Read [Current Status](CURRENT_STATUS.md) first when deciding what to work on next. It is intentionally shorter than the kanban and records the active milestone, manual validation items, local ports, known risks, and recommended next work.

## Product Direction

Flight Life App should make the next duty day easier to understand quickly:

- what happens next;
- when the user starts;
- where the user is going;
- what live operational changes matter;
- when to start moving;
- whether a stay-vs-home decision needs attention.

The home dashboard should show every day in the next 7 days, including compressed off days, so a missing day never looks like a parser gap.

Implemented workflow beyond the first dashboard includes a full roster agenda and richer stay-vs-home decision context:

- Calendar v1 is a mobile agenda, not a month grid.
- The calendar agenda shows the full imported roster period and every date in order.
- Calendar decision markers follow the same AMS-ending duty rule as Home.
- GPT is an on-demand advisor only. It cannot override the deterministic backend recommendation.
- Backend gathers traffic, weather, roster, preference, and decision facts. GPT interprets a compact structured context.

Settings now also owns roster-management trust, source-PDF cleanup, and provider readiness:

- Current roster means the latest successful import.
- Import history is read-only audit/history, not rollback or old-roster preview.
- Settings shows current import metadata, recent successful imports, parser warning signal, preserved-days context, and source PDF privacy state.
- Source PDFs can be deleted irreversibly without deleting parsed roster data, import metadata, or manual decisions.
- Source-PDF deletion uses an in-app confirmation path so it works consistently across Expo targets.
- Settings shows privacy-safe operational readiness for AF/KLM, TomTom, Open-Meteo, and OpenAI so missing optional configuration is visible before manual provider testing.

## Data Sources

### Planned Source Of Truth

The roster PDF is the source of truth for planned duties, flights, hotels, taxis, off days, and rest periods.

### Live Enrichment

The AF/KLM FlightStatus API is a live enrichment source only. It may add operations data for flights within 90 minutes of the current time:

- CTOT;
- TSAT;
- parking position;
- previous flight arrival time;
- departure delay time only;
- aircraft registration;
- aircraft type.

Live data must not silently reorder, hide, or replace the planned roster. The roster stays the baseline, and live differences are displayed as annotations.

### Decision Context Enrichment

Traffic and weather are external context sources for stay-vs-home decisions. They are not planned roster sources and must not rewrite roster facts.

Traffic v1 should use TomTom from the backend for only the stay-vs-home routes:

- AMS to home after an AMS-ending duty;
- home to AMS before the next AMS-starting duty.

Traffic is calculated for the relevant planned decision window, not blindly for the current moment. Exact home coordinates are stored only in backend local config/database, never committed, and not sent raw to GPT unless a later feature explicitly requires it.

The normal stay-vs-home decision DTO includes TomTom route-specific commute reasoning when available. If TomTom is unavailable, missing coordinates, or missing one route, the backend falls back to the configured commute preference and keeps the decision flow usable.

Weather v1 should use Open-Meteo as secondary context. The backend fetches only decision-relevant windows and summarizes facts such as rain likely, strong wind, low visibility, normal conditions, or unavailable.

## Implemented Baseline

From a clean local setup, the user can:

1. Open the iPhone app.
2. Go to Settings.
3. Upload a roster PDF.
4. See a trustworthy import summary.
5. Return to Home.
6. See every day for the next 7 days rendered from parsed backend data.

The import must preserve existing parsed data outside the newly imported roster period. Overlapping dates are updated only when they are present in the new roster. Failed imports must not corrupt existing data.

## Architecture

- Frontend: Expo, React Native, Expo Router, TypeScript, npm.
- Backend: Python, FastAPI, SQLAlchemy, Alembic, SQLite.
- Deployment target: Raspberry Pi with Docker Compose.
- Remote access for v1: Tailscale VPN to the Raspberry Pi backend.
- Later remote exposure: Cloudflare Tunnel only after authentication/security is designed.
- Frontend install path: Expo Go/development build during development, then EAS internal distribution or TestFlight for operational testing.

The backend owns parsing, persistence, import merge rules, live AF/KLM API calls, traffic/weather provider calls, OpenAI calls, credentials, preferences, deterministic decisions, and decision-advisor context. The frontend owns mobile presentation, upload UI, settings UI, calendar agenda UI, decision panes, and a read-only fallback cache of the last successful 7-day schedule response.

## Persistence Decisions

Version 1 uses SQLite on the backend for:

- parsed roster records;
- import metadata;
- preferences;
- manual decision overrides;
- short-lived AI advisor cache metadata and structured advisor results.
- import metadata including source PDF deletion status.

Use SQLAlchemy and Alembic from the start so schema changes are controlled. Raw uploaded PDFs stay in ignored local runtime storage under `flight-life-app-server/rosters/`.

## Import Rules

- Roster PDFs are released weekly and cover Monday plus 4 weeks.
- A new import replaces only dates present in that roster period.
- Existing data outside the imported period remains available.
- Manual decisions are preserved if the underlying duty is substantially the same.
- A materially changed duty marks related decisions as needing review.
- Material duty change starts as:
  - different duty type;
  - changed flight sequence;
  - changed overnight station;
  - duty start/end changed by more than 60 minutes.
- The 60-minute threshold may become a setting later.

## Trust Rules

The app becomes untrustworthy if it silently:

- hides a roster duty;
- changes planned duty order based on live data;
- overwrites current-week data during a future roster import;
- applies a partial failed import;
- treats uncertain recommendations as certain.

Unknown duties should render as other duty blocks with start/end times and warnings where needed.

## Privacy Rules

Never commit:

- real roster PDFs;
- parsed outputs from real rosters;
- runtime logs containing private roster data;
- crew names;
- employee identifiers;
- screenshots containing real roster data;
- AF/KLM API credentials;
- TomTom, OpenAI, and Open-Meteo-related local secrets;
- exact home coordinates or addresses;
- `.env` files or local secrets.

Real roster PDFs may be used locally for parser development and manual QA, but committed automated tests must use sanitized synthetic fixtures that mimic the real structure without copying private data.

## Current Source Code Status

The backend currently contains a FastAPI app, parser modules for extracting NetLine/Crew roster PDF information, a parser normalization boundary, SQLite persistence with SQLAlchemy/Alembic, a roster upload/import endpoint, date-scoped import merge behavior, current/recent import history APIs, source-PDF deletion, next-7-days and date-range schedule APIs, backend-owned preferences, a deterministic stay-vs-home decision engine with TomTom commute reasoning and preference fallback, backend-only traffic context with TomTom, backend-only weather context with Open-Meteo summaries, a compact decision context builder, an on-demand OpenAI structured decision advisor endpoint with short-lived cache, a privacy-safe operational readiness endpoint, a backend-only AF/KLM FlightStatus client, a 90-minute operations enrichment API, layout-aware parser coverage for alphanumeric aircraft codes and split flight-number tokens, a guard against text-extraction false-positive flight legs, and a Docker Compose deployment shape for Raspberry Pi/Tailscale backend testing.

The frontend currently contains a backend-driven Home dashboard, Settings roster import, current roster/import history display, source-PDF deletion flow with in-app confirmation, local cached-data reset, backend configuration, operational readiness display, Decisions integration with manual overrides, an AI advisor panel inside decision surfaces, operations chips/detail panels, a Calendar tab that renders the full imported roster period as a mobile agenda, Jest/ts-jest presenter tests for DTO-to-render-model behavior, and backend API-client/cache tests for URL normalization, readiness behavior, offline health fallback behavior, source-PDF deletion behavior, and local cache clearing.

The backend has committed pytest coverage for API smoke behavior, parser characterization, parser normalization, persistence setup, upload/import validation, date-scoped merge behavior, rollback behavior, schedule DTO output, preferences behavior, deterministic stay-vs-home decisions, mocked FlightStatus client normalization, operations enrichment eligibility/fallback behavior, traffic context, weather context, and OpenAI advisor structured-output/cache behavior. The frontend has deterministic presenter tests for Home schedule mapping, Settings import-history/readiness mapping, and backend API-client boundary behavior.

## Current Planning Documents

- [Current Status](CURRENT_STATUS.md)
- [Product Requirements Document](docs/product/flight-life-app-prd.md)
- [Architecture Decision Log](docs/product/decisions.md)
- [Kanban Issue Plan](docs/product/flight-life-app-kanban.md)
- [Milestones History](docs/product/milestones-history.md)
- [API Contracts](docs/product/api-contracts.md)
- [Issue Drafts](docs/issues/)

## Definition Of Done

A slice is done only when:

- it is implemented as a small coherent vertical slice;
- behavior changes have meaningful tests where tooling exists;
- parser and import changes use deterministic fixtures;
- relevant checks have run;
- the diff has been reviewed for readability, duplication, naming, coupling, and unnecessary complexity;
- private roster data, logs, screenshots, and secrets remain uncommitted;
- remaining risks or assumptions are stated.
