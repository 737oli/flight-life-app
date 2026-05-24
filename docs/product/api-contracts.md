# API Contracts

## Purpose

This file is the shared index for backend endpoints consumed by the mobile app. It records ownership, frontend consumers, and source-of-truth constraints so future work does not infer contract behavior from UI code alone.

Base local backend URL:

```text
http://127.0.0.1:8010
```

## Source-Of-Truth Rules

- Roster PDFs define the planned schedule.
- Schedule endpoints return planned roster facts and must not silently hide, reorder, or rewrite duties.
- AF/KLM operations data annotates eligible near-term flights only.
- Traffic, weather, and AI advisor data are decision context only.
- Backend owns credentials and external API calls. The frontend never calls AF/KLM, TomTom, Open-Meteo, or OpenAI directly.
- Raw PDFs, SQLite files, logs, exact home coordinates, and secrets stay in ignored backend runtime storage.

## Endpoint Index

| Endpoint | Method | Backend Owner | Frontend Consumer | Notes |
| --- | --- | --- | --- | --- |
| `/health` | `GET` | `main.py` | Settings connection check | No secrets; used to validate configured API URL. |
| `/rosters/import` | `POST` | `flight_life/api.py`, import/parser services | Settings roster upload | Accepts one PDF file. Atomic import; failed core parsing keeps existing data unchanged. |
| `/rosters/imports?limit=10` | `GET` | import history service | Settings current roster/import history | Successful imports only. Does not expose local filesystem paths. `current_import` is latest successful import. |
| `/rosters/imports/{import_id}/source-pdf` | `DELETE` | import history service | Settings source-PDF cleanup | Deletes retained PDF only, clears stored path, records deletion timestamp, preserves parsed data and metadata. |
| `/system/readiness` | `GET` | readiness service | Settings operational readiness | Reports provider readiness and missing input names without secrets, coordinates, file paths, or raw provider payloads. |
| `/schedule/next-7-days` | `GET` | schedule service | Home, Calendar seed request, Decisions | Returns exactly 7 calendar days from `start_date` or today. Missing dates are explicit. |
| `/schedule` | `GET` | schedule service | Calendar agenda | Requires `start_date` and `end_date`. Returns every requested date in order for the selected range. |
| `/preferences` | `GET` | preferences service | Settings preferences | Backend-side preference source. Frontend may cache only for display. |
| `/preferences` | `PUT` | preferences service | Settings preferences | Validates editable local preferences. |
| `/decisions/stay-vs-home/{decision_date}` | `GET` | decision service | Decisions, Home markers, Calendar markers | Deterministic backend recommendation. Only AMS-ending flight days should surface decision prompts in the frontend. |
| `/decisions/stay-vs-home/{decision_date}/override` | `PUT` | decision service | Decisions, decision panes | Saves manual choice for the current decision. Roster material changes can mark it needs review. |
| `/decisions/stay-vs-home/{decision_date}/advisor` | `POST` | AI advisor/context services | AI advisor panel inside decision panes | On demand only. GPT interprets compact backend-owned facts and cannot override the deterministic result. |
| `/operations/flights/{flight_leg_id}` | `GET` | operations service | Home operations chips, flight detail panel | Uses schedule `flight_leg_id`. Returns scheduled baseline plus live annotations inside the 90-minute window. |

## Frontend Contract Boundary

The TypeScript API boundary lives in `flight-life-app/services/backendApi.ts`. When a backend DTO changes, update:

1. backend service tests;
2. `services/backendApi.ts` types;
3. frontend presenter/render-model tests;
4. relevant UI screens.

## Privacy Notes

- Do not add raw provider payloads to frontend state or committed fixtures.
- Do not store live operations responses long-term on the backend. Frontend may keep short-lived/read-only display caches where explicitly designed.
- Test fixtures must use synthetic data only.
