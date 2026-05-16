# Architecture Decision Log

This file records Flight Life App architecture decisions. New decisions should be appended as ADR-style entries.

## ADR-001: Build A Single-User Private App First

Status: Accepted

Decision: Flight Life App is for one pilot/crew member first. The app should be clean enough to evolve for another crew member later, but version 1 will not include accounts, multi-user support, sharing, or SaaS-style product decisions.

Rationale: The core value depends on personal roster data, personal preferences, and private operational use. Multi-user architecture would slow down the first useful slice.

## ADR-002: Use The Roster PDF As Planned Source Of Truth

Status: Accepted

Decision: The roster PDF is the source of truth for planned duties, flights, hotels, taxis, off days, and rest periods.

Rationale: The roster is the authoritative plan. Other data sources may enrich it, but must not silently rewrite or hide it.

## ADR-003: Use AF/KLM FlightStatus API Only As Live Enrichment

Status: Accepted

Decision: AF/KLM FlightStatus data enriches near-term flights but does not replace planned roster data. The desired fields are CTOT, TSAT, parking position, previous flight arrival time, departure delay time, aircraft registration, and aircraft type.

Rationale: Live data is operationally useful but time-sensitive and sometimes incomplete. The roster baseline must remain trustworthy.

## ADR-004: Limit Live Operations To A 90-Minute Window

Status: Accepted

Decision: Fetch and display live operations data only for flights within 90 minutes of current time.

Rationale: This keeps API use focused and keeps the dashboard calm. Outside that window, scheduled roster information is sufficient.

## ADR-005: Keep AF/KLM Credentials Backend-Side

Status: Accepted

Decision: The frontend never calls AF/KLM APIs directly and never stores API credentials. The backend owns live API calls, credential storage, throttling, short-lived caching, normalization, and error handling.

Rationale: Mobile app code cannot safely contain API secrets. Backend ownership also keeps live data normalization testable.

## ADR-006: Use Expo React Native For The Frontend

Status: Accepted

Decision: The frontend uses Expo, React Native, Expo Router, TypeScript, and npm.

Rationale: The primary use case is mobile-first iPhone use during real operational windows. Web remains useful for development and emergency access.

## ADR-007: Use FastAPI For The Backend API

Status: Accepted

Decision: The backend uses Python and FastAPI.

Rationale: The existing backend already uses FastAPI. Python is appropriate for the parser-heavy backend and straightforward local APIs.

## ADR-008: Use SQLite, SQLAlchemy, And Alembic

Status: Accepted

Decision: Persist parsed roster data, import metadata, preferences, and manual decisions in SQLite using SQLAlchemy and Alembic.

Rationale: The app is single-user and private, but it needs durable local state and controlled schema evolution. Flat files would become fragile once imports, decisions, preferences, and date-scoped merges interact.

## ADR-009: Use Date-Scoped Roster Imports

Status: Accepted

Decision: New roster imports replace only dates present in the imported roster period. Existing parsed data outside the imported period remains available.

Rationale: Weekly roster PDFs cover Monday plus 4 weeks. Replacing all data would lose current-week context.

## ADR-010: Apply Imports Atomically

Status: Accepted

Decision: Failed core imports must leave existing data unchanged. Imports with non-core warnings may proceed only when enough core data is valid.

Rationale: Schedule data must be trustworthy. A partial failed import must not corrupt a previously usable roster.

## ADR-011: Preserve Manual Decisions Across Stable Duties

Status: Accepted

Decision: Manual decisions should be preserved when an overlapping imported duty is substantially the same. If duty type, route sequence, overnight station, or duty start/end changes materially, related decisions are marked as needing review.

Rationale: Manual decisions are personal state. They should not disappear unnecessarily, but they must not remain confidently attached to changed duties.

The initial material time threshold is 60 minutes and may become configurable later.

## ADR-012: Put Roster Upload In Settings

Status: Accepted

Decision: Roster upload/import belongs in Settings. Home can show an empty state with an import action when no roster exists, but Settings owns the upload flow and import summary.

Rationale: Home should stay focused on current and next duties. Import is setup/maintenance behavior that needs status, errors, and metadata.

## ADR-013: Use Raspberry Pi With Docker Compose For Backend Deployment

Status: Accepted

Decision: Deploy the backend to a Raspberry Pi with Docker Compose. SQLite, uploaded PDFs, logs, and env config should live in mounted volumes.

Rationale: The app needs an always-on private backend that can be reached during operational windows. Docker Compose makes local Pi deployment reproducible.

## ADR-014: Use Tailscale For V1 Remote Access

Status: Accepted

Decision: Use Tailscale VPN as the v1 remote access path to the Raspberry Pi backend. Cloudflare Tunnel is deferred until authentication/security are designed.

Rationale: Tailscale keeps the backend private and avoids exposing an unauthenticated public API. Cloudflare is a possible later deployment path.

## ADR-015: Cache Last Successful Schedule Response On Device

Status: Accepted

Decision: The frontend should cache the last successful 7-day schedule response as a read-only fallback. Backend remains the source of truth.

Rationale: The app should still show planned duties when the backend or VPN is temporarily unreachable. Upload/import and live enrichment still require backend access.

## ADR-016: Keep Real Roster PDFs Local And Ignored

Status: Accepted

Decision: Real roster PDFs may be used for local parser development and manual QA, but must be ignored and never committed. Committed tests must use sanitized synthetic fixtures.

Rationale: Real roster data can contain private personal, crew, and operational details. Parser correctness needs real-layout validation, but project artifacts must remain sanitized.

