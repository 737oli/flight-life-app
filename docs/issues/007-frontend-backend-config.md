# Issue 007: Frontend Backend Configuration And Connection Status

## Status

Done.

## Goal

Add frontend infrastructure for configuring and checking the backend API URL.

## Why

The app must work locally, on Expo/iPhone, and later against a Raspberry Pi reachable through Tailscale. `127.0.0.1` is not enough for device testing.

## Scope

- Create a frontend API client boundary.
- Add configurable backend base URL.
- Add backend health/connection status fetch.
- Show connection status in Settings or a placeholder settings screen.
- Keep secrets out of frontend configuration.

## Out Of Scope

- Do not build roster upload UI yet.
- Do not implement schedule rendering from backend yet.
- Do not store AF/KLM credentials in frontend.

## Acceptance Criteria

- Frontend can call backend health/status through a configurable URL.
- Backend URL works for local web and can be changed for device/Tailscale testing.
- Connection failures produce a clear state, not a crash.

## Validation

- Run frontend lint.
- Manually verify against local backend where practical.
