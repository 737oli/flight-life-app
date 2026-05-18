# Issue 022: Expo SDK Compatibility Refresh

## Status

Ready.

## Goal

Align frontend package versions with the installed Expo SDK so development logs are clean and native builds are less fragile.

## Why

Expo currently reports several package-version compatibility warnings during startup. The app works, but these warnings can hide more important runtime issues and may cause native build friction later.

## Scope

- Run Expo dependency checks.
- Update Expo-managed packages to versions expected by the current SDK.
- Keep manually chosen dependencies compatible.
- Verify the app still starts after the dependency refresh.

## Out Of Scope

- Do not upgrade to a new major Expo SDK unless explicitly chosen.
- Do not refactor app code unless required by compatible package updates.
- Do not add new native capabilities.

## Acceptance Criteria

- Expo startup no longer reports SDK compatibility warnings, or remaining warnings are documented with a reason.
- TypeScript still passes.
- Frontend lint still passes or only reports known pre-existing warnings.
- Lockfile changes are committed with the package changes.

## Validation

- Run `npx expo install --check` or equivalent.
- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Start Expo web or iOS once after the update.
