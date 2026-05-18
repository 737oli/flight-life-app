# Repository Instructions for Codex

## Project Overview

This workspace contains Flight Life App: a private personal flight-duty companion for uploading roster PDFs, parsing planned duties, enriching near-term flights with live operations data, and showing a trustworthy mobile dashboard.

The root folder is not currently a git repository. It contains two separate git repositories plus shared planning docs:

- `flight-life-app/` - Expo, React Native, Expo Router, TypeScript frontend.
- `flight-life-app-server/` - Python FastAPI backend plus roster PDF parser.
- `docs/` - shared project documentation.
- `docs/ai/` - AI-agent standards and workflows.
- `docs/product/` - product, architecture, kanban, and decision docs.
- `docs/issues/` - independently grabbable issue drafts.

## Required References

Before making non-trivial changes, read:

- `PROJECT_CONTEXT.md`
- `docs/ai/coding-standards.md`
- `docs/ai/testing-strategy.md`
- `docs/ai/architecture-guidelines.md`

Before reviewing code, read:

- `docs/ai/code-review.md`

Before planning larger work, read:

- `docs/ai/planning-workflow.md`
- `docs/product/flight-life-app-prd.md`
- `docs/product/flight-life-app-kanban.md`

Before changing shared project docs, read:

- `docs/ai/shared-docs-workflow.md`

## Current Planning Documents

- `PROJECT_CONTEXT.md`
- `docs/product/flight-life-app-prd.md`
- `docs/product/decisions.md`
- `docs/product/flight-life-app-kanban.md`
- `docs/issues/`

## Product Rules

- The roster PDF is the source of truth for planned duties, flights, hotels, taxis, off days, and rest periods.
- AF/KLM FlightStatus data is live enrichment only.
- Live data must never silently reorder, hide, or replace planned roster data.
- Home shows every day in the next 7 days, including compressed off days.
- Settings owns backend connection status, roster upload/import, last import summary, and basic preferences.
- Backend owns parsing, persistence, import merge rules, live API calls, credentials, preferences, and decision logic.
- Frontend owns mobile presentation, upload UI, settings UI, and a read-only fallback cache of the last successful schedule response.

## Privacy And Data Safety

Never commit:

- real roster PDFs;
- parsed JSON or other outputs from real rosters;
- logs containing private roster data;
- crew names;
- employee identifiers;
- screenshots containing real roster data;
- AF/KLM API credentials;
- `.env`, `.env.local`, or `.env.*` files.

Real roster PDFs may be used locally for parser development and manual QA. Keep them in ignored runtime storage such as `flight-life-app-server/rosters/`. Committed tests must use sanitized synthetic fixtures.

## Git And Workspace Rules

- Treat `flight-life-app/` and `flight-life-app-server/` as separate repositories.
- The workspace root is not a git repository.
- Shared project docs are tracked in both child repositories so GitHub Copilot and other repo-local tools can reference them.
- The canonical shared docs source is the backend repo copy: `flight-life-app-server/AGENTS.md`, `flight-life-app-server/PROJECT_CONTEXT.md`, and `flight-life-app-server/docs/`.
- Do not hand-edit shared docs twice. Edit the backend repo copy, then run `flight-life-app-server/scripts/sync-shared-docs.sh` to copy shared docs into `flight-life-app/`.
- After syncing shared docs, commit and push the shared-doc changes in both child repositories.
- Check git status inside the relevant child repo before code edits.
- Never revert user changes unless explicitly requested.
- The frontend may have local uncommitted user work; work with it, do not undo it.
- The workspace-root docs are local convenience copies only. Do not treat them as the source of truth unless they are intentionally refreshed from the backend repo.

## Build, Test, And Verification

Frontend:

- Install dependencies: `cd flight-life-app && npm install`
- Start Expo: `cd flight-life-app && npm run start`
- Start on iOS: `cd flight-life-app && npm run ios`
- Start on Android: `cd flight-life-app && npm run android`
- Start web: `cd flight-life-app && npm run web`
- Start LAN mode: `cd flight-life-app && npm run lan`
- Lint: `cd flight-life-app && npm run lint`

Backend:

- Install dependencies: `cd flight-life-app-server && python -m pip install -r requirements.txt`
- Run dev server: `cd flight-life-app-server && uvicorn main:app --reload --host 0.0.0.0 --port 8010`
- Run parser CLI: `cd flight-life-app-server && python pdfParser.py rosters/<local-private-roster>.pdf`

Testing:

- No committed test suite exists yet.
- Add deterministic behavior tests before changing parser, import, persistence, schedule contract, decision, or live-ops behavior.
- Backend tests should use synthetic fixtures.
- Real roster PDFs are allowed only for local manual QA.

Docker and deployment:

- Target deployment is Raspberry Pi with Docker Compose.
- Backend state should live in mounted volumes for SQLite, uploaded PDFs, logs, and ignored env config.
- Remote v1 access is through Tailscale VPN, not a public unauthenticated endpoint.
- Cloudflare Tunnel is a later hardening track after authentication/security is designed.

## Definition Of Done

A task is done only when:

- the change is implemented as a small, coherent slice;
- behavior changes are covered by meaningful tests where tooling exists;
- relevant checks have been run or explicitly marked unavailable;
- parser/import changes avoid committing private roster data;
- the diff has been reviewed for readability, duplication, naming, coupling, privacy, and unnecessary complexity;
- remaining risks or unverified assumptions are stated.
