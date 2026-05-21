# Issue 024: Operations Data Retention And Departure Superscript QA

## Status

Done.

## Implementation Notes

- Root cause for disappearing delay annotations: the Home screen only rendered operations chips for the next future flight inside the 90-minute window, and the backend correctly returns scheduled-only data after the flight leaves that window.
- Fix: the frontend now stores a minimal last-known operations annotation per flight leg when live data is available. It keeps only display fields such as delay minutes/times, stand, CTOT/TSAT, previous arrival, aircraft registration/type, walking start, and capture time; it does not store raw AF/KLM responses.
- Completed-flight annotations are marked as "Last known" on Home and "Last-known live annotation" in the detail panel.
- Root cause for missing departure superscript: the detail panel depended on explicit `delay_minutes` and did not derive a departure deviation from scheduled/latest departure timestamps when the explicit delay field was missing.
- Fix: the detail panel derives departure and arrival deviations from scheduled/latest timestamps and renders the revised time with a small signed superscript when there is a difference.

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
