# Issue 043: Settings Operational Readiness Panel

## Status

Done.

## Milestone

Operational Readiness Diagnostics

## Goal

Show backend operational-provider readiness in Settings so local, Pi, and Tailscale testing can quickly identify missing optional configuration.

## Why

The app already has backend connection status. Provider readiness is the next practical layer for operational testing: it should show whether live operations, traffic, weather, and AI advisor dependencies are ready without turning Settings into a secrets surface.

## Scope

- Add frontend API types and client call for `/system/readiness`.
- Add a deterministic presenter model for readiness rows.
- Add Settings UI under the Backend panel.
- Auto-refresh readiness on Settings focus and after successful backend checks.
- Add a manual refresh action.
- Add frontend presenter tests with synthetic data only.
- Update frontend/shared docs.

## Out Of Scope

- No live provider test calls from the frontend.
- No credential editing in the frontend.
- No display of API keys, exact coordinates, local paths, raw provider payloads, or raw prompts.
- No push/background checks.

## Acceptance Criteria

- Settings shows provider readiness when the backend is reachable.
- Missing optional configuration is visible but non-blocking.
- The frontend never stores or displays secrets.
- Presenter tests cover ready and missing-provider states.

## Validation

- `npm run test`
- `npm run typecheck`
- `npm run lint`

## Dependencies

- Issue 042.

## GitHub

- Frontend issue to be created/closed after implementation.
