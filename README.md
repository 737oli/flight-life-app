# Flight Life App

Mobile-first Expo app for a private personal flight-duty companion. The app uploads roster PDFs through Settings, reads the parsed backend schedule, keeps a read-only fallback cache for Home, and shows live operations annotations only through the backend.

The primary target is iPhone with Expo Go or a development/internal build. Web is useful for development and emergency access, but Pi-hosted web is not part of the current mobile-first deployment path.

## Current Scope

- Home renders every day in the next 7 days from `/schedule/next-7-days`, including compressed off days and explicit missing-roster days.
- Settings owns backend API URL, connection status, operational readiness, roster import, current roster/import history, source PDF cleanup, and editable backend preferences.
- Operations data is displayed as annotations for the next relevant flight and in the flight detail panel.
- The frontend never calls AF/KLM directly and never stores API credentials.
- If the backend is unavailable, Home renders the last successful cached schedule response when available. Upload/import and live operations still require backend access.

## Requirements

- Node.js 18+.
- npm.
- Xcode for iOS simulator testing on macOS.
- Expo Go for fast device testing, or an EAS internal/TestFlight build once native configuration settles.
- A running `flight-life-app-server` backend for roster import, preferences, decisions, and operations enrichment.

## Setup

```bash
npm install
```

Start Expo on the project port:

```bash
npm run start
```

Useful scripts:

```bash
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # React Native Web on port 8090
npm run lan      # Expo LAN mode on port 8090
npm run test     # Jest/ts-jest presenter tests
npm run typecheck # TypeScript check
npm run lint     # Expo ESLint
```

All Expo scripts use port `8090` so this project can run beside other local apps.

## Backend URL

Default backend URL:

```text
http://127.0.0.1:8010
```

You can override it at runtime in the Settings screen. That value is stored locally on the device.

For simulator/web development, run the backend locally:

```bash
cd ../flight-life-app-server
uvicorn main:app --reload --host 0.0.0.0 --port 8010
```

For iPhone operational testing through a Raspberry Pi, connect the iPhone and Pi to the same Tailscale tailnet and set Settings API URL to:

```text
http://<pi-tailscale-name-or-ip>:8010
```

Then tap Check in Settings before importing or refreshing schedule data.

## Privacy

Never commit:

- real roster PDFs;
- parsed output from real rosters;
- screenshots containing real roster data;
- AF/KLM API credentials;
- TomTom/OpenAI/Open-Meteo-related local secrets;
- exact home coordinates or addresses;
- `.env`, `.env.local`, or `.env.*` files.

Frontend environment values must not contain secrets. API credentials belong only in backend-side ignored environment config.

## Shared Docs Workflow

Shared project docs are committed into both repositories so GitHub Copilot can reference them locally. The backend repo is the source of truth for:

- `AGENTS.md`
- `PROJECT_CONTEXT.md`
- `docs/`

Edit shared docs in `../flight-life-app-server/`, then sync them into this repo:

```bash
../flight-life-app-server/scripts/sync-shared-docs.sh
```

Preview a sync without changing files:

```bash
../flight-life-app-server/scripts/sync-shared-docs.sh --dry-run
```

After syncing, review, commit, and push the docs changes in both child repositories. Do not hand-edit the same shared docs separately in both repos.

## Project Structure

```text
app/           Expo Router screens and layouts
components/    Reusable UI components
constants/     App colors and constants
data/          Legacy/static mock data
services/      Backend API, cache, parsing, and helper services
types/         Shared TypeScript interfaces
scripts/       Project utility scripts
```

## Current Limitations

- No App Store release path yet.
- No accounts, sharing, cloud sync, or public backend exposure.
- No background refresh or push notifications.
- Live operations are limited to backend-enriched eligible flights.
- Frontend automated tests currently cover deterministic presenter logic. Component, device, screenshot, and end-to-end tests are still deferred.

## Tech Stack

- Expo SDK 54
- React 19
- React Native 0.81
- Expo Router 6
- TypeScript 5.9
