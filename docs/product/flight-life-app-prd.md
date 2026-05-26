# PRD: Flight Life App

## 1. Problem Statement

Flight crew roster planning currently requires reading a roster PDF, mentally reconstructing duties, checking live operational changes, and making personal planning decisions under time pressure. The first version of Flight Life App should turn a private roster PDF into a trustworthy mobile dashboard that shows the next 7 days and highlights what matters now.

The app must protect trust above everything else. It must not silently hide duties, reorder planned days based on live data, overwrite current-week data during future roster imports, or apply partial failed imports without warning.

## 2. Solution Summary

Flight Life App is a private single-user mobile app with a backend running on a Raspberry Pi.

- Frontend: Expo, React Native, Expo Router, TypeScript.
- Backend: Python, FastAPI, SQLAlchemy, Alembic, SQLite.
- Deployment: Docker Compose on Raspberry Pi.
- Remote access: Tailscale VPN for v1.
- Live operations: backend-only AF/KLM FlightStatus integration.

The implemented baseline is an end-to-end import and dashboard slice:

1. User opens the iPhone app.
2. User goes to Settings.
3. User uploads a roster PDF.
4. Backend saves the PDF in ignored local runtime storage.
5. Backend parses, validates, and imports the roster atomically.
6. Backend persists parsed roster data and import metadata in SQLite.
7. Settings shows a clear import summary.
8. Home shows every day in the next 7 days from backend schedule data.
9. Frontend caches the last successful 7-day response as read-only fallback data.

Later completed increments added:

- a full imported-roster mobile agenda;
- backend traffic context for stay-vs-home decisions;
- backend weather context as secondary support;
- an on-demand GPT advisor that interprets backend-owned facts without replacing the deterministic recommendation.
- roster import history and privacy controls in Settings so the user can trust the current roster and delete retained source PDFs without losing parsed data.
- privacy-safe operational readiness diagnostics for optional live/provider configuration.

## 3. Product Rules

### Planned Schedule

The roster PDF is the source of truth for planned duties, flights, hotels, taxis, off days, and rest periods.

The home dashboard must show every day in the next 7 days. Off days should be compressed visually, but still present.

Unknown non-flying duties should appear as "other duty" blocks with available start/end details rather than being hidden.

### Live Operations

AF/KLM FlightStatus data enriches only flights inside the 90-minute operations window from the current time.

The desired live fields are:

- CTOT;
- TSAT;
- parking position;
- previous flight arrival time;
- departure delay time only;
- aircraft registration;
- aircraft type.

Outside the operations window, the app shows scheduled roster information only.

Missing live fields should stay quiet unless they affect a decision. The detail view may show neutral missing-field context such as "stand unknown"; the dashboard should not become noisy.

### Walking Time

Version 1 calculates walking time from scheduled departure time minus a default walking buffer. Start with 40 minutes for AMS. Revised walking time based on delayed aircraft or revised schedule is a later issue.

### Stay-Vs-Home Decisions

Version 1 should use deterministic rules, not AI/ML scoring. Inputs include:

- arrival station;
- next duty start;
- time between duties;
- travel time home;
- hotel/rest availability;
- whether going home creates useful time;
- personal preference defaults.

The backend owns the decision engine and returns a recommendation plus reasoning. The frontend owns presentation, confirmation, overrides, and later preference editing.

When TomTom is configured, stay-vs-home decision reasoning should show route-specific expected commute times for AMS-to-home and home-to-AMS. If TomTom is unavailable, missing coordinates, or missing a route, the decision must fall back to the configured commute assumption and keep the flow usable.

AMS-to-home estimates should be requested for the planned duty-end departure time. Home-to-AMS estimates should be requested for arrival by the next AMS-starting duty start, not by deriving a departure time from the configured fallback commute assumption.

Decision states should include "needs review" when inputs are missing or weak.

AI advisor v1 is not an official decision engine. The backend rule result remains authoritative. GPT can add structured context only after the user taps an analysis action inside a decision detail pane. If GPT disagrees with the deterministic result, the app should show a disagreement or needs-review state instead of silently trusting GPT.

### Calendar Agenda

Calendar v1 should be a mobile agenda, not a month grid.

Acceptance criteria:

- The agenda uses a backend date-range schedule endpoint.
- The agenda shows the full imported roster period.
- Days are grouped by week and ordered by date.
- Every day is visible, including compressed off days.
- AMS-ending flight days may show small decision status markers.
- AI advisor content is not shown directly in agenda rows.

### Traffic And Weather Decision Context

Traffic v1 should use a backend-only TomTom provider for expected travel times on stay-vs-home routes only:

- AMS to home after an AMS-ending duty;
- home to AMS before the next AMS-starting duty.

Traffic should be calculated for the relevant planned decision window. Exact home coordinates are stored only in backend local config/database, never committed, and not sent raw to GPT unless explicitly required later.

Weather v1 should use Open-Meteo as secondary context. The backend should summarize decision-relevant weather windows before passing facts into decision context or GPT.

### Roster Import History And Privacy Controls

Settings should clearly identify the current roster as the latest successful import. Import history is read-only audit/history only; it is not rollback, restore, or old-roster preview.

The Current roster card should show source filename, import timestamp, roster period, parsed day/flight counts, inserted/updated/unchanged date counts, parser warning count, source PDF privacy state, and a route to the calendar.

Recent imports should show successful imports only. Failed/rejected imports are not persisted in history for this milestone.

Deleting a source PDF is irreversible. It deletes only the retained local source PDF, clears the stored path, marks a deletion timestamp, and keeps parsed roster data, import metadata, and manual decisions.

The frontend may offer a local-only timestamp display preference for import history: local phone time by default, or UTC. The active mode must be clearly labeled.

Settings should also include a local data reset for stale frontend cache recovery. This action clears device-local cached schedule data, last-known operations snapshots, and local import-history display preferences only. It must not delete backend roster data, import metadata, source PDFs, manual decisions, backend preferences, or the configured API URL.

### Operational Readiness Diagnostics

Settings should show whether optional backend provider configuration is ready for manual operational testing.

Acceptance criteria:

- Backend readiness reports AF/KLM, TomTom, Open-Meteo, and OpenAI state.
- Missing configuration is visible but non-blocking.
- The endpoint and UI never expose API keys, exact home coordinates, filesystem paths, raw provider payloads, raw prompts, or private roster data.
- Readiness does not perform live provider calls; it only reports local configuration state.

## 4. User Stories

### Upload A Roster

As the app user, I want to upload a roster PDF from Settings so that I do not need to manually place files on the backend server.

Acceptance criteria:

- Settings includes a roster import control.
- The backend accepts PDF upload from the frontend.
- Uploaded PDFs are stored in ignored backend runtime storage.
- The import response includes roster period, parsed counts, inserted/updated/unchanged date counts, warnings, and a route to view the updated schedule.
- Failed core parsing leaves existing data unchanged.

### View The Next 7 Days

As the app user, I want Home to show every day in the next 7 days so that I can trust there are no hidden gaps.

Acceptance criteria:

- Home renders all next 7 calendar days.
- Off days appear in compressed form.
- Flight duty days show duty window, flights, ground/taxi/rest context where available.
- Unknown duties render as other duty blocks.
- When backend is unreachable, the last successful cached 7-day schedule can be shown as read-only fallback.

### Preserve Existing Roster Data

As the app user, I want new Thursday roster imports to update only the dates they contain so that current-week data is not lost.

Acceptance criteria:

- New imports replace dates inside the imported roster period.
- Existing dates outside the imported period remain available.
- Overlap dates are updated atomically.
- Failed imports do not corrupt existing parsed schedule.
- Manual decisions are preserved when the underlying duty remains substantially the same.

### Trust The Current Roster Import

As the app user, I want Settings to show the current roster import and recent import history so that I can verify what schedule baseline I am using.

Acceptance criteria:

- Current roster means the latest successful import.
- Settings shows source filename, import timestamp, roster period, parsed counts, change counts, warning count, and source PDF privacy state.
- The backend indicates when preserved roster days exist outside the current import period.
- Recent import history is read-only and successful-import-only.
- Import-history errors do not block backend checks, preferences, or new roster upload.

### Delete Retained Source PDFs

As the app user, I want to delete retained source PDFs after import so that private roster files do not linger locally once parsed data is available.

Acceptance criteria:

- The user can delete the source PDF for any import, including the current import.
- A confirmation explains that parsed roster data remains.
- Deletion is irreversible and has no undo.
- The import card remains visible and shows `Source PDF deleted`.
- Parsed schedule data and import metadata remain available after deletion.

### See Operational Data Near Departure

As the app user, I want live operations data only for flights that are close enough to matter so that the dashboard stays calm and useful.

Acceptance criteria:

- Backend fetches AF/KLM FlightStatus data only for flights within 90 minutes of current time.
- Frontend dashboard shows compact ops chips for relevant flights.
- Detail view shows a fuller operations panel.
- Live data is displayed as annotation, not as silent replacement of roster data.
- API credentials never reach the frontend.

### Make Stay-Vs-Home Decisions

As the app user, I want the app to recommend whether I should stay at outstation or go home so that I can make personal planning decisions faster.

Acceptance criteria:

- Backend returns recommendation, reasoning, and confidence/review state.
- Missing or weak inputs produce "needs review" instead of fake certainty.
- Manual user choice can override the recommendation for the current duty/decision.
- If a later roster import materially changes the duty, the decision is marked as needing review.

## 5. Implementation Decisions Already Made

- Single-user private app first.
- Roster PDF is planned source of truth.
- AF/KLM FlightStatus API is backend-only live enrichment.
- Operations window is 90 minutes from current time.
- Home dashboard horizon is next 7 days.
- Settings owns roster upload/import and backend connection state.
- Backend owns parser, persistence, import merge, live API integration, credentials, preferences, and decisions.
- Frontend owns mobile UI, upload flow, schedule presentation, and read-only fallback cache.
- Calendar v1 is a mobile agenda backed by a date-range schedule endpoint.
- Backend owns traffic/weather provider calls and OpenAI calls.
- TomTom is the first traffic provider for stay-vs-home expected travel times.
- Open-Meteo is the first weather provider for secondary decision context.
- GPT is on-demand advisor context only and cannot override deterministic backend recommendations.
- AI advisor responses use a short-lived backend cache keyed by decision/context hash.
- SQLite is backend persistence.
- SQLAlchemy and Alembic should be used from the start.
- Raspberry Pi plus Docker Compose is the v1 deployment target.
- Tailscale is the v1 remote access path.
- Cloudflare Tunnel is deferred until authentication/security are designed.
- Raw PDFs are local ignored runtime data.
- Import history is read-only audit/history, not roster rollback.
- Current roster means latest successful import.
- Source PDF deletion removes only the retained local PDF and preserves parsed roster data.
- Import-history timestamp display is a frontend-only preference scoped to roster import history.
- Tests must use sanitized synthetic fixtures; real PDFs are local manual QA only.

## 6. Testing Decisions

Testing should follow `docs/ai/testing-strategy.md`:

- fast feedback first;
- behavior tests over implementation-detail tests;
- characterization tests before changing unclear parser behavior;
- deterministic fixtures;
- smallest relevant test set first, broader checks before finalizing.

Current test priorities:

- backend parser characterization with local real PDF for manual QA and synthetic committed fixtures for automation;
- import validation and failed-import rollback;
- date-scoped merge/upsert behavior;
- schedule API output;
- frontend schedule mapping and dashboard behavior through deterministic presenter tests;
- Settings import history, source PDF cleanup, and unavailable states through deterministic presenter tests first, with component tests added later when needed.

## 7. Still Out Of Scope Or Deferred

- Month-grid calendar UI.
- Editable parsed duties.
- Advanced stay-vs-home scoring.
- Revised walking time from live delays.
- Background refresh.
- Push notifications.
- Cloud sync.
- Multi-user support.
- Public Cloudflare deployment.
- App Store release.
- Polished final visual design.
- General chatbot behavior.
- Background AI analysis.
- Permanent raw prompt or full AI transcript storage.
- Roster rollback, restore, or old-import schedule preview.
- Failed import durable history.

## 8. Definition Of Done

The implemented baseline is considered done when:

- the app can upload a roster PDF from Settings;
- the backend validates, parses, persists, and date-merges the import;
- the import summary is visible and trustworthy;
- failed imports leave previous data intact;
- Home renders every day in the next 7 days from backend data;
- frontend can show a read-only cached schedule when backend is unavailable;
- private PDFs, logs, secrets, and real parsed data remain uncommitted;
- relevant tests and checks have run;
- remaining risks are documented.
