# Testing Strategy

## Core Principle

Fast, deterministic feedback comes first. Prefer behavior tests around meaningful boundaries over tests that mirror implementation details.

## Flight Life Risk Areas

Prioritize tests where a mistake would break trust:

- roster parser behavior;
- roster period and calendar date resolution;
- date-scoped import merge/upsert behavior;
- failed-import rollback;
- manual decision preservation and invalidation;
- schedule DTO/API output;
- frontend mapping from backend DTOs to the 7-day dashboard;
- 90-minute operations-window eligibility;
- timezone and daylight-saving edge cases.

## Real PDFs And Fixtures

Real roster PDFs may be used locally for manual parser development and QA, but they must remain ignored and uncommitted.

Committed automated tests must use sanitized synthetic fixtures:

- fake names;
- fake identifiers;
- fake or generic duty examples;
- no copied private roster text;
- no parsed output from real rosters.

If a real PDF reveals a parser edge case, reproduce the structure with fake data before committing a regression test.

## When Changing Behavior

Codex should:

1. Identify existing relevant tests.
2. Add characterization tests before changing unclear parser behavior.
3. Add or update behavior tests for the requested change.
4. Run the smallest relevant test set first.
5. Run broader checks before finalizing.

## First Backend Test Targets

- FastAPI health/root behavior.
- Parser characterization with synthetic fixtures.
- Import validation and warning/error states.
- Date-scoped merge behavior.
- Rollback on failed import.
- Schedule API returns exactly 7 calendar days for Home.
- Preferences and decision rules.
- Operations enrichment with frozen time and mocked AF/KLM responses.

## First Frontend Test Targets

When frontend test tooling is added, prioritize:

- backend DTO to dashboard render-model mapping;
- Home empty/import-needed state;
- Home backend-unreachable fallback cache state;
- every-day-in-next-7-days rendering;
- compressed off-day rendering;
- Settings upload success/warning/error states;
- operations chips and detail panel behavior.

## Test Quality

Good tests are:

- fast;
- independent;
- repeatable;
- self-validating;
- timely;
- built around user-visible or contract-visible behavior.

Avoid tests that only verify mocks, duplicate the implementation, or depend on live AF/KLM calls.

