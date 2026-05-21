# Issue 028: Home Inline AMS Decision Placement

## Status

Done.

## Goal

Move Home decision prompts into the flight day they refer to, show details in a pane, place overnight text after flights, and only show stay-vs-home decisions for flight days ending in AMS.

## Why

Manual QA showed that a top-level Home decision card is too detached from the roster day it refers to. The decision should live with the relevant flight day, and outstation-ending days should not prompt a go-home decision because going home is not realistic from outstation.

## Scope

- Remove the top-level Home decision card.
- Show a small decision reference inside the relevant flight day card.
- Color decision-needed and needs-review references with the caution/orange tone.
- Open a detail pane from the Home decision reference with the same decision context shown on Decisions.
- Move `Overnight ...` text after the flight sequence.
- Filter frontend decision candidates to flight duties whose final arrival station is AMS.

## Out Of Scope

- Do not change backend decision-engine scoring rules.
- Do not add push notifications or background refresh.
- Do not add a full decision history view.

## Acceptance Criteria

- Home no longer shows a standalone top decision card.
- The Home decision reference appears under the AMS-ending flight day it belongs to.
- Recommended or needs-review decisions are orange/caution colored until manually confirmed.
- Tapping the Home decision reference opens a pane with decision details.
- Outstation-ending flight days do not show stay-vs-home decision prompts.
- Overnight station text appears after the flight sequence.

## Validation

- Run frontend TypeScript compile.
- Run frontend lint.
- Manually verify Home and Decisions against the local backend.
