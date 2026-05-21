# Issue 027: Decision Manual Override Action Reliability

## Status

Done.

## Goal

Fix the Decisions tab manual override action so tapping `Go Home` or `Stay` reliably saves the choice and updates the visible decision state.

## Why

Manual QA found that the manual override button from the Decisions test flow does not appear to do anything. This breaks the trust contract for decision confirmation and should be fixed before surfacing decision state on Home.

## Scope

- Reproduce the broken override action on web and, where possible, Expo/iPhone.
- Verify whether the failure is caused by the confirmation alert, touch handling, API request, backend response handling, or UI state refresh.
- Make the action visibly responsive:
  - show a clear confirmation or save flow;
  - show loading/disabled state while saving;
  - update the card to `overridden` after success;
  - show a clear error if the backend rejects the override.
- Keep the backend-owned decision contract unchanged unless the frontend exposes a genuine API mismatch.
- Add a focused regression path for the override action where frontend tooling allows it.

## Out Of Scope

- Do not add Home decision summary behavior in this slice.
- Do not change the backend decision engine rules unless a confirmed contract bug is found.
- Do not add full decision history or notification behavior.

## Acceptance Criteria

- Tapping `Go Home` or `Stay` from a decision card produces a visible result.
- A successful override persists through the backend and remains after refresh/navigation.
- A failed override shows an actionable error state instead of appearing inert.
- The Decisions tab still renders recommendation, reasoning, missing inputs, and overridden state correctly.
- Issue 026 can proceed after this is verified.

## Validation

- Run frontend TypeScript compile.
- Run frontend lint.
- Smoke test Decisions against the local backend.
- Specifically click/tap both override buttons and verify persisted state after refresh.

## Implementation Notes

- Replaced the platform-dependent alert confirmation with an inline confirmation panel.
- The Decisions card now shows visible save state and inline save errors.
- Both backend override choices were verified through the local API and persisted after readback.
