# Project Context: Flight Life App

## Project Purpose

Flight Life App is a private, personal flight-duty companion for turning roster PDFs into a trustworthy operational dashboard. The first real product goal is to upload a roster PDF from the mobile app, parse it on the backend, persist the parsed schedule, and show the next 7 days in the iPhone app.

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
- `flight-life-app-server/PROJECT_CONTEXT.md`
- `flight-life-app-server/docs/`

When shared docs change, edit the backend repo copy, run `flight-life-app-server/scripts/sync-shared-docs.sh`, then commit and push the resulting docs changes in both child repositories.

## Product Direction

Flight Life App should make the next duty day easier to understand quickly:

- what happens next;
- when the user starts;
- where the user is going;
- what live operational changes matter;
- when to start moving;
- whether a stay-vs-home decision needs attention.

The home dashboard should show every day in the next 7 days, including compressed off days, so a missing day never looks like a parser gap.

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

## First Implementation Milestone

From a clean local setup, the user can:

1. Open the iPhone app.
2. Go to Settings.
3. Upload a roster PDF.
4. See a trustworthy import summary.
5. Return to Home.
6. See every day for the next 7 days rendered from parsed backend data.

The import must preserve existing parsed data outside the newly imported roster period. Overlapping dates are updated only when they are present in the new roster. Failed imports must not corrupt existing data.

## Planned Architecture

- Frontend: Expo, React Native, Expo Router, TypeScript, npm.
- Backend: Python, FastAPI, SQLAlchemy, Alembic, SQLite.
- Deployment target: Raspberry Pi with Docker Compose.
- Remote access for v1: Tailscale VPN to the Raspberry Pi backend.
- Later remote exposure: Cloudflare Tunnel only after authentication/security is designed.
- Frontend install path: Expo Go/development build during development, then EAS internal distribution or TestFlight for operational testing.

The backend owns parsing, persistence, import merge rules, live AF/KLM API calls, credentials, preferences, and decision logic. The frontend owns mobile presentation, upload UI, settings UI, and a read-only fallback cache of the last successful 7-day schedule response.

## Persistence Decisions

Version 1 should use SQLite on the backend for:

- parsed roster records;
- import metadata;
- preferences;
- manual decision overrides.

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
- `.env` files or local secrets.

Real roster PDFs may be used locally for parser development and manual QA, but committed automated tests must use sanitized synthetic fixtures that mimic the real structure without copying private data.

## Current Source Code Status

The frontend currently contains a mobile dashboard shell with mock flight, duty, ground, taxi, rest, off-day, and operations data. It also contains a mock stay-vs-home decisions screen. Some tabs referenced by the layout are not yet implemented.

The backend currently contains a basic FastAPI app and parser modules for extracting NetLine/Crew roster PDF information. It does not yet expose the upload/import/schedule API needed by the first milestone.

There are currently no committed frontend or backend test files.

## Current Planning Documents

- [Product Requirements Document](docs/product/flight-life-app-prd.md)
- [Architecture Decision Log](docs/product/decisions.md)
- [Kanban Issue Plan](docs/product/flight-life-app-kanban.md)
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
