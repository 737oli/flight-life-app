# Raspberry Pi Backend Deployment

## Goal

Run the Flight Life App backend on a Raspberry Pi with Docker Compose, reachable from the iPhone app through Tailscale for private operational testing.

This deploys the backend only. Expo/iPhone remains the primary frontend path, and Pi-hosted web is not part of the first milestone.

## Privacy Boundary

Keep this backend private. Do not expose it publicly through router port forwarding or Cloudflare Tunnel until authentication/security is designed.

Version 1 remote access should be:

- Raspberry Pi on the same Tailscale tailnet as the iPhone;
- backend bound on the Pi so Tailscale clients can reach it;
- API URL configured in the app Settings screen.

## Files

- `Dockerfile` builds the backend image.
- `docker-compose.yml` runs the backend service.
- `requirements-runtime.txt` keeps the runtime image focused on API/parser dependencies.
- `deploy/pi.env.example` documents local Compose settings.
- `.dockerignore` keeps private PDFs, SQLite files, logs, env files, and virtualenvs out of the image build context.

## Runtime State

Docker Compose uses named volumes:

- `flight_life_runtime` mounted at `/app/runtime` for SQLite;
- `flight_life_rosters` mounted at `/app/rosters` for uploaded PDFs;
- `flight_life_logs` mounted at `/app/logs` for runtime logs.

The container runs `alembic upgrade head` before starting the API, so a new empty SQLite volume is initialized automatically.

`docker-compose.yml` also passes optional `AFKLM_API_KEY` and `AFKLM_API_BASE_URL` values from the ignored `.env` file into the container for live operations testing.

Future decision-context provider keys, such as TomTom and OpenAI, must follow the same backend-only `.env` rule. Exact home coordinates should live only in backend local config/database and must not be committed.

## Local Smoke Test

From `flight-life-app-server/`:

```bash
cp deploy/pi.env.example .env
docker compose build
docker compose up -d
```

In another terminal:

```bash
curl http://127.0.0.1:8010/health
```

Expected response:

```json
{"status":"ok","service":"flight-life-app-server"}
```

Stop the service:

```bash
docker compose down
```

Do not use `docker compose down -v` unless you intentionally want to delete the local SQLite database and uploaded PDFs stored in Compose volumes.

## Raspberry Pi Setup

1. Install Docker Engine and Docker Compose on the Raspberry Pi.
2. Install and authenticate Tailscale on the Pi.
3. Clone or pull `737oli/flight-life-app-server`.
4. Create the ignored Compose env file:

   ```bash
   cp deploy/pi.env.example .env
   ```

5. Keep the default Pi binding for Tailscale testing and add AF/KLM credentials only if live operations testing is needed:

   ```bash
   FLIGHT_LIFE_BIND_HOST=0.0.0.0
   FLIGHT_LIFE_PORT=8010
   AFKLM_API_KEY=<local-private-key>
   AFKLM_API_BASE_URL=https://api.airfranceklm.com/opendata
   ```

6. Start the backend:

   ```bash
   docker compose up -d --build
   ```

7. Find the Pi Tailscale hostname or IP:

   ```bash
   tailscale status
   ```

8. From a Tailscale-connected device, test:

   ```bash
   curl http://<pi-tailscale-name-or-ip>:8010/health
   ```

9. Optionally run the backend smoke helper from another Tailscale-connected machine:

   ```bash
   scripts/tailscale-smoke-check.sh http://<pi-tailscale-name-or-ip>:8010 rosters/<local-private-roster>.pdf
   ```

   This checks `/health`, optionally imports a private local roster PDF, and fetches `/schedule/next-7-days`.

10. In the iPhone app Settings screen, set API URL to:

   ```text
   http://<pi-tailscale-name-or-ip>:8010
   ```

Then tap Check. Roster import and Home schedule fetches use that stored URL. The final Tailscale acceptance check is the real iPhone path: Settings connection check, roster import, then Home refresh over the Pi URL.

## Operational Notes

- Uploaded source PDFs remain in the `flight_life_rosters` Docker volume.
- The durable app data is the SQLite database in `flight_life_runtime`.
- API credentials for later AF/KLM integration must be stored in ignored backend env config, never in the frontend.
- Traffic/OpenAI credentials and exact home coordinates are backend-only decision-context data and must never be stored in frontend code or committed docs.
- Cloudflare Tunnel remains deferred until authentication/security is designed.
