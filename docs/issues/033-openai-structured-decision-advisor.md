# Issue 033: OpenAI Structured Decision Advisor Endpoint

## Status

Ready.

## Goal

Add an on-demand backend endpoint that asks OpenAI for a structured advisor result for one stay-vs-home decision.

## Why

The deterministic backend recommendation remains the official app result. GPT should add context and interpretation only when the user requests it, with strict cost and privacy controls.

## Scope

- Add an on-demand AI advisor endpoint for a specific decision.
- Use backend-only OpenAI API credentials from environment/config.
- Make the model name configurable without code changes.
- Send only the compact decision context from Issue 032.
- Require structured JSON output with recommendation, confidence, summary, reasoning points, risks, missing inputs, and facts used.
- Validate the model response before returning it.
- Keep deterministic backend recommendation authoritative.
- Surface disagreement/needs-review if GPT disagrees with the deterministic result.
- Add short-lived cache keyed by decision/context hash.

## Out Of Scope

- No general chatbot.
- No background AI calls.
- No permanent raw prompt storage.
- No frontend panel.
- No weather context unless Issue 035 is already implemented.

## Acceptance Criteria

- Endpoint works only on demand.
- Reopening the same unchanged context uses short-lived cache.
- Invalid or unsupported model responses are rejected safely.
- Deterministic recommendation is never overwritten by GPT.
- API failure returns a clean unavailable state.
- Tests mock OpenAI responses and cover success, cache hit, disagreement, invalid response, and provider failure.

## Validation

- Run focused backend AI advisor tests with mocked OpenAI calls.
- Run full backend `pytest`.

