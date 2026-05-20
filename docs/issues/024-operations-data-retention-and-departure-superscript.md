# Issue 024: Operations Data Retention And Departure Superscript QA

## Status

Ready.

## Goal

Fix two operations UI reliability issues:

- arrival/departure delay data on the "Where is Olivier now" overview disappears after the flight;
- the departure superscript on the specific flight dashboard is sometimes not shown.

## Why

Operations annotations must remain trustworthy after the flight has moved out of the live 90-minute window. If delay data disappears after completion, the app looks like it silently rewrote operational history. If departure superscript formatting is inconsistent, the specific flight dashboard becomes harder to interpret and may hide relevant planned-vs-live timing context.

## Scope

- Reproduce and identify why delay data is dropped after a flight completes.
- Preserve the last known arrival/departure delay annotations for completed flights on the overview.
- Determine whether the deletion is caused by frontend state/filtering, fallback-cache replacement, or backend operations eligibility returning scheduled-only after the window.
- If backend support is required, add a minimal operations snapshot/cache behavior that keeps only the required delay annotation fields and does not store full live API payloads long-term.
- Reproduce and fix the missing departure superscript on the specific flight dashboard.
- Add or update frontend render/state tests where tooling exists, or add focused deterministic helper tests if full component tests are not available yet.

## Out Of Scope

- Do not add background refresh.
- Do not add push notifications.
- Do not store full AF/KLM live API responses long-term.
- Do not change the roster plan baseline or reorder completed flights.
- Do not redesign the full operations UI.

## Acceptance Criteria

- Arrival/departure delay data that was visible before or during a flight remains visible after the flight completes.
- Completed-flight delay annotations are clearly marked as last-known/live-derived annotations, not roster-plan replacements.
- The "Where is Olivier now" overview no longer drops delay data solely because the flight moved outside the operations window.
- The specific flight dashboard consistently renders the departure superscript when the underlying departure timing data requires it.
- Missing departure superscript root cause is documented in the issue or implementation notes.
- Existing scheduled roster data remains the baseline.

## Validation

- Reproduce the current disappearing-delay behavior before fixing it.
- Reproduce the missing departure superscript case before fixing it.
- Run frontend lint.
- Run any relevant frontend tests or document that component test tooling is still unavailable.
- If backend operations cache/snapshot behavior is changed, run backend operations tests with frozen time and mocked AF/KLM responses.
