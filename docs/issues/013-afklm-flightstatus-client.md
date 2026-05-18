# Issue 013: AF/KLM FlightStatus Backend Client

## Status

Done.

## Goal

Add a backend client for the AF/KLM FlightStatus API.

## Why

Live operations data should enrich flights inside the 90-minute window, but API credentials must remain backend-side.

## Scope

- Confirm official request/response shape from AF/KLM developer docs or account.
- Add backend-only client using env-configured credentials.
- Normalize desired fields:
  - CTOT;
  - TSAT;
  - parking position;
  - previous flight arrival time;
  - departure delay time only;
  - aircraft registration;
  - aircraft type.
- Add short-lived caching if useful.
- Handle missing fields quietly.

## Out Of Scope

- Do not expose credentials to frontend.
- Do not add Cloudflare/public deployment.
- Do not render frontend operations UI yet.

## Acceptance Criteria

- Client can fetch and normalize live status for a flight.
- Missing fields do not crash.
- Credentials are read from ignored env config.
- Tests use mocked API responses.

## Validation

- Run backend client tests with mocked responses.
- Manually verify against AF/KLM API only with local ignored credentials.

## Completed Notes

- Added a backend-only AF/KLM FlightStatus client using env-configured `AFKLM_API_KEY` and optional `AFKLM_API_BASE_URL`.
- Added tolerant normalization for CTOT, TSAT, parking position, previous-flight arrival, delay minutes, aircraft registration/type, and basic status fields.
- Missing live fields normalize to `null` instead of creating noisy failures.
- Added mocked client tests. Live credential validation remains local/manual only.
