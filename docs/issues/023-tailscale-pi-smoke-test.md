# Issue 023: Tailscale Raspberry Pi Smoke Test

## Status

Ready.

## Goal

Verify the Docker Compose backend through a Raspberry Pi Tailscale address and document the exact working iPhone API URL.

## Why

The local import-to-Home flow works, and Docker Compose has been validated locally. The remaining deployment uncertainty is the real Pi/Tailscale route from iPhone to backend during operational testing.

## Scope

- Deploy or update the backend on the Raspberry Pi with Docker Compose.
- Confirm the backend is reachable at `http://<pi-tailscale-name-or-ip>:8010/health`.
- Configure the iPhone app Settings API URL to the Pi/Tailscale backend URL.
- Run one roster import and Home schedule refresh over Tailscale.
- Update deployment docs with any real-world Pi/Tailscale notes.

## Out Of Scope

- Do not expose the backend publicly.
- Do not add Cloudflare Tunnel.
- Do not add authentication in this issue.
- Do not deploy frontend web to the Pi.

## Acceptance Criteria

- Health endpoint works over Tailscale.
- iPhone Settings connection check works against the Pi backend.
- Roster import works over Tailscale.
- Home renders backend schedule data over Tailscale.
- Any setup gotchas are captured in docs.

## Validation

- `docker compose up -d --build` on the Pi.
- `curl http://<pi-tailscale-name-or-ip>:8010/health` from another Tailscale device.
- Manual iPhone app QA through Settings and Home.
