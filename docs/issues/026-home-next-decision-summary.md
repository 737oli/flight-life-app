# Issue 026: Home Next Decision Summary

## Status

Blocked.

## Goal

Show the next actionable stay-vs-home decision on Home when a current or upcoming duty needs attention.

## Why

The user’s primary daily question is what decision needs attention soon. The Decisions tab can hold the full list, but Home should surface the next relevant decision without requiring the user to hunt for it.

## Scope

- Blocked by Issue 027.
- Fetch or reuse backend stay-vs-home decision data for the next relevant duty.
- Show a compact Home card for:
  - needs-review decision;
  - recommended stay/go-home decision;
  - confirmed manual override when useful.
- Link/tap through to the Decisions tab.
- Keep Home’s 7-day roster baseline visible and unchanged.

## Out Of Scope

- Do not add notification scheduling.
- Do not add background refresh.
- Do not add advanced decision scoring.
- Do not show a full decision history on Home.

## Acceptance Criteria

- Home can answer which planning decision needs attention next.
- The decision card does not hide or reorder roster days.
- Missing inputs show as review context, not certainty.
- Tapping the card takes the user to Decisions.

## Validation

- Run frontend TypeScript compile.
- Run frontend lint.
- Manually smoke test Home and Decisions against the local backend.
