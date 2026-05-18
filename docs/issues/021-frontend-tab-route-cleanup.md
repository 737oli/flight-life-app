# Issue 021: Frontend Tab Route Cleanup

## Status

Ready.

## Goal

Clean up the frontend tab navigation so Expo no longer warns about missing tab routes.

## Why

Manual QA of the first import-to-Home milestone worked, but Expo still warns that `layovers`, `meals`, and `chores` are referenced in the tab layout without matching route files. That noise makes real warnings harder to spot while testing.

## Scope

- Decide whether `layovers`, `meals`, and `chores` should be hidden for now or represented by simple placeholder screens.
- Update the Expo Router tab layout accordingly.
- Keep Dashboard, Decisions, and Settings working.
- Preserve mobile-first tab ergonomics.

## Out Of Scope

- Do not implement full layover, meal, or chores features.
- Do not redesign the whole navigation structure.
- Do not touch backend behavior.

## Acceptance Criteria

- Expo no longer logs missing route warnings for tab children.
- Existing Dashboard, Decisions, and Settings tabs still load.
- The navigation state remains understandable on iPhone.

## Validation

- Run `npm run lint`.
- Run `npx tsc --noEmit`.
- Start Expo and confirm the missing route warnings are gone.
