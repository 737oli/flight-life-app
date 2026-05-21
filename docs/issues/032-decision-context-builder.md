# Issue 032: Decision Context Builder For Advisor Data

## Status

Ready.

## Goal

Build a backend decision context service that gathers all structured facts needed for a stay-vs-home advisor result.

## Why

GPT should interpret a compact, backend-owned data package. It should not fetch its own traffic/weather data, inspect raw PDFs, or receive full roster dumps.

## Scope

- Add a decision context builder for AMS-ending stay-vs-home decisions.
- Include relevant roster facts for the duty and next duty.
- Include deterministic backend recommendation and reasoning.
- Include preference facts that affect the decision.
- Include traffic facts from Issue 031 when available.
- Include degraded-state facts when traffic is unavailable.
- Produce a compact structured context object suitable for API display and GPT prompting.

## Out Of Scope

- No OpenAI call.
- No weather context unless Issue 035 is already available and easy to plug in.
- No frontend changes.
- No long-term AI storage.

## Acceptance Criteria

- Context exists only for valid AMS-ending decision candidates.
- Outstation-ending duties remain excluded.
- Context includes enough facts to explain stay-vs-home without sending the full roster.
- Missing traffic data is explicit but does not block context creation.
- Tests cover normal context, missing traffic, no next duty, and excluded non-AMS decisions.

## Validation

- Run focused backend decision-context tests.
- Run full backend `pytest`.

