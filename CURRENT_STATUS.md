# Current Status: Flight Life App

Last updated: 2026-05-23

## Current State

The app has a working private single-user baseline:

- Backend imports roster PDFs, parses and persists roster data, preserves dates outside the imported roster period, and exposes schedule, preferences, decisions, operations, AI advisor, and import-history APIs.
- Frontend shows Home, Calendar, Decisions, Settings roster import, current roster/import history, source-PDF cleanup, operations panels, deterministic decision surfaces, and on-demand AI advisor context.
- Shared docs are tracked in both child repositories, with the backend repo as the canonical source.

## Active Milestone

No active implementation milestone is selected after completing the Documentation Operating Model And Test Foundation milestone.

Most recent completed local issues:

- `040` Shared docs operating model refresh.
- `041` Frontend behavior test foundation.

## Manual Validation Still Open

- `023` Tailscale Raspberry Pi smoke test remains a real-device/manual validation item.
- Live AF/KLM, TomTom, and OpenAI behavior still requires local credentials and operational-window/manual checks.

## Local Development Ports

- Backend API: `http://127.0.0.1:8010`
- Expo frontend: port `8090`

Useful commands:

```bash
cd flight-life-app-server
uvicorn main:app --reload --host 0.0.0.0 --port 8010
python -m pytest

cd ../flight-life-app
npm run start
npm run test
npm run lint
npm run typecheck
```

## Current Risks

- Pi/Tailscale path is designed and documented, but still needs real-device validation.
- Frontend automated coverage currently starts with deterministic presenter tests; native/device automation remains out of scope.
- Source-of-truth boundaries must remain explicit: roster data is planned baseline, live/traffic/weather/AI data is annotation or decision context only.
- Real roster PDFs, parsed private outputs, exact home coordinates, secrets, and screenshots with private data must remain uncommitted.

## Next Recommended Work

1. Run issue `023` when the Raspberry Pi and iPhone/Tailscale setup is available.
2. Choose the next product milestone.
3. Keep frontend contract changes covered by presenter tests before changing related UI screens.
