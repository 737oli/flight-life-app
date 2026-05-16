# Architecture Guidelines

## Core Principle

Preserve trust by keeping source-of-truth boundaries explicit.

The roster PDF defines the planned schedule. Live operations data annotates near-term flights. The frontend presents state and caches fallback data, but the backend owns parsing, persistence, merge rules, credentials, live API calls, preferences, and decisions.

## Deep Modules

Prefer deep modules with:

- small public interfaces;
- clear ownership;
- hidden implementation details;
- strong internal cohesion;
- behavior worth testing at the module boundary.

## Flight Life Module Boundaries

### Parser Boundary

Parser modules should turn roster PDFs into project-owned intermediate data. They should not know about frontend presentation.

### Import Boundary

Import logic owns validation, atomic database application, date-scoped replacement, import summaries, and warning/error classification.

### Schedule Boundary

Schedule services own conversion from persisted roster data into stable DTOs for the frontend.

### Operations Boundary

Operations services own AF/KLM API calls, credential use, response normalization, short-lived caching, and 90-minute eligibility rules.

### Decision Boundary

Decision services own stay-vs-home recommendations, reasoning, manual overrides, and "needs review" states.

### Frontend Boundary

Frontend code owns mobile presentation, Settings upload flow, Home rendering, detail views, and read-only fallback cache. It should not contain AF/KLM credentials or backend decision logic.

## Avoid

- Hidden source-of-truth swaps.
- Reordering roster days based on live data.
- Parser logic inside React components.
- Business decisions embedded in UI-only helpers.
- API credentials in the mobile app.
- Storing real roster data in committed fixtures.
- Shallow wrappers that scatter date/time rules across the codebase.
- Manual SQLite schema changes without migrations.

## External Boundaries

At external boundaries:

- isolate AF/KLM API details behind backend adapters;
- normalize external payloads into project-owned DTOs;
- mock external calls in tests;
- keep secrets in ignored backend env files;
- use Tailscale for v1 remote access to the Raspberry Pi backend;
- defer public Cloudflare exposure until authentication/security are designed.

