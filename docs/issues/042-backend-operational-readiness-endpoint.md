# Issue 042: Backend Operational Readiness Endpoint

## Status

Done.

## Milestone

Operational Readiness Diagnostics

## Goal

Expose a privacy-safe backend endpoint that shows whether optional operational providers are configured for live operations and decision-context testing.

## Why

The remaining manual work depends on Pi/Tailscale and provider credentials. Before testing during operational windows, the backend should make missing optional configuration visible without exposing secrets.

## Scope

- Add a backend-owned readiness service.
- Add `GET /system/readiness`.
- Report provider readiness for:
  - AF/KLM FlightStatus;
  - TomTom traffic;
  - Open-Meteo weather;
  - OpenAI advisor.
- Return configured/partial/not-configured state, missing input names, notes, and model name where safe.
- Never return API keys, exact home coordinates, filesystem paths, raw provider payloads, or private roster data.
- Add deterministic backend tests.
- Update shared API docs.

## Out Of Scope

- No live provider calls.
- No credential validation against external networks.
- No authentication/public exposure.
- No frontend UI beyond the follow-up slice.

## Acceptance Criteria

- `/system/readiness` returns provider readiness without exposing secret values.
- Missing provider inputs are easy to identify.
- Open-Meteo is shown as available without an API key, with partial state when home coordinates are missing.
- Tests verify missing config behavior and privacy of returned payload.

## Validation

- `.venv/bin/python -m pytest tests/test_readiness_service.py`
- Full backend `pytest` before finalizing.

## GitHub

- Backend issue to be created/closed after implementation.
