# Issue 002: Parser Characterization With Private PDF And Synthetic Fixtures

## Status

Done.

## Goal

Characterize current parser behavior before changing it.

## Why

Roster parsing is high-risk. A real private PDF should be used locally to understand the actual layout, but committed tests must use sanitized synthetic fixtures.

## Scope

- Start after Issue 001 has created the backend test harness.
- Use a local ignored real roster PDF for manual parser exploration.
- Identify the structural cases the parser must support.
- Create committed synthetic fixtures that mimic those structures with fake data.
- Add parser characterization tests around current behavior.
- Document known parser limitations and warnings.

## Out Of Scope

- Do not commit the real roster PDF.
- Do not commit direct parsed output from the real roster.
- Do not implement import persistence.
- Do not build upload UI.

## Acceptance Criteria

- Parser tests cover header extraction, duty table extraction, flight-day extraction, taxi/hotel derivation, and date resolution where possible.
- Fixtures contain no real names, employee identifiers, or private roster text.
- Known parser gaps are documented as follow-up issues.

## Validation

- Run focused parser tests.
- Run the parser manually against a local ignored real PDF and summarize results without copying private data.
