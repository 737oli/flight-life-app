# Issue 045: Frontend Backend API Client Tests

## Status

Done.

## Milestone

Frontend Maintenance And API Boundary Tests

## Goal

Add deterministic tests around the frontend backend API client boundary.

## Why

The app now depends on several backend-owned endpoints from Settings, Home, Calendar, Decisions, and operations panels. The TypeScript API client is a trust boundary: URL normalization, offline health handling, and typed API errors should stay stable as endpoint usage grows.

## Scope

- Add Jest tests for backend base URL normalization.
- Add a mocked success-path test for `/system/readiness`.
- Add a typed HTTP-error test for readiness failures.
- Add an offline backend health fallback test.
- Keep tests synthetic, network-free, and secret-free.

## Out Of Scope

- No live backend calls.
- No device or component automation.
- No coverage target or CI gate change.

## Acceptance Criteria

- Tests mock `fetch` and AsyncStorage.
- Tests verify normalized readiness URL usage.
- Tests verify typed readiness failure behavior.
- Tests verify backend-unavailable health fallback behavior.
- Existing frontend test, typecheck, and lint commands pass.

## Validation

- `npm run test`
- `npm run typecheck`
- `npm run lint`

## Dependencies

- Issue 041 frontend test foundation.

## GitHub

- Frontend issue to be created/closed after implementation.
