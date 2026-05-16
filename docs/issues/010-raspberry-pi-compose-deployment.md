# Issue 010: Raspberry Pi Docker Compose Backend Deployment

## Goal

Make the backend deployable on a Raspberry Pi with Docker Compose.

## Why

Operational testing requires the iPhone app to reach an always-on backend during real duty windows. The v1 remote path is Tailscale to the Raspberry Pi.

## Scope

- Start after Issue 001 so the containerized backend has a basic health/test baseline.
- Add backend Dockerfile.
- Add Docker Compose configuration.
- Mount or prepare volumes for:
  - SQLite database;
  - uploaded roster PDFs;
  - logs;
  - ignored env config.
- Document Tailscale URL/hostname use.
- Keep backend private; do not expose a public unauthenticated API.
- If persistence is not implemented yet, create the Compose structure with planned volume paths and update them when Issue 003 lands.

## Out Of Scope

- Do not deploy frontend web to the Pi.
- Do not add Cloudflare Tunnel yet.
- Do not add public auth.

## Acceptance Criteria

- Backend can run with Docker Compose locally or on Pi.
- Runtime state survives container rebuild.
- `.env` and runtime volumes are ignored.
- Health endpoint is reachable through the configured Pi/Tailscale address.

## Validation

- Run `docker compose build`.
- Run `docker compose up` and hit backend health endpoint where practical.
