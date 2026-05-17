# Issue 017: Real Roster Parser QA And Sanitized Fixture Capture

## Status

Done.

## Goal

Turn real ignored roster parser failures into safe, repeatable test cases.

## Why

Real-roster QA showed incomplete flight extraction: low flight-leg counts, flight-duty days missing legs, and suspicious route assignment. The app should not build upload and Home behavior on a parser gap that is only visible manually.

## Scope

- Use the real ignored PDF locally only to identify parser layout patterns and counts.
- Add sanitized synthetic fixtures for flight-duty days where legs are missed.
- Cover multi-leg duty layout with fake data.
- Cover route-first layout where a leg could otherwise be malformed.
- Update parser characterization docs with counts only.

## Out Of Scope

- Do not commit real PDFs.
- Do not commit parsed output from a real roster.
- Do not copy private roster text into fixtures or docs.

## Acceptance Criteria

- Synthetic tests reproduce the missed-leg and route-shape cases with fake data.
- Private QA is documented with counts only.
- Fixture files contain no crew data, employee identifiers, or copied roster text.

## Validation

- Run focused parser characterization tests.
- Run counts-only local QA against `rosters/<local-private-roster>.pdf`.
