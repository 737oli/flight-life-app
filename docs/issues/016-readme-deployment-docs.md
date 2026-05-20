# Issue 016: README And Deployment Documentation Refresh

## Status

Done.

## Goal

Update repository READMEs and deployment docs to match the implemented Pi/Tailscale flow.

## Why

The app spans two repositories and will run on a Raspberry Pi. Future work needs accurate setup, deployment, privacy, and validation instructions.

## Scope

- Update frontend README:
  - mobile-first purpose;
  - scripts;
  - backend URL configuration;
  - Expo testing path;
  - current limitations.
- Update backend README:
  - setup;
  - tests;
  - parser;
  - upload/import API;
  - Docker Compose;
  - runtime volumes;
  - Tailscale access.
- Add or update root docs if needed.
- Document privacy rules for PDFs, logs, screenshots, and env files.

## Out Of Scope

- Do not add Cloudflare Tunnel instructions except as future work.
- Do not publish to App Store.
- Do not commit secrets or real data.

## Acceptance Criteria

- A future developer can run frontend and backend locally.
- A future developer can deploy backend to Raspberry Pi with Compose.
- The iPhone/Tailscale testing path is documented.
- Privacy rules are visible.

## Validation

- Read docs against actual commands and files.
- Run available checks if docs changes include code/config changes.
