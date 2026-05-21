# Issue 034: AI Advisor Panel In Decision Detail Pane

## Status

Done.

## Goal

Add the frontend AI advisor experience inside the existing decision detail pane.

## Why

AI should be tied to a specific stay-vs-home decision. It should not become a separate chatbot or a headline dashboard feature.

## Scope

- Show deterministic backend rule recommendation first.
- Add an `Analyze with AI` action inside the Home and Decisions decision panes.
- Call the backend AI advisor endpoint from Issue 033 only when the user taps the action.
- Show loading, cached result, unavailable, and retry states.
- Render structured advisor output below the rule recommendation.
- Clearly show disagreement/needs-review when GPT and backend rule result conflict.

## Out Of Scope

- No new AI tab.
- No chat UI.
- No frontend OpenAI calls.
- No API keys in the frontend.
- No background AI refresh.

## Acceptance Criteria

- AI analysis is user-triggered only.
- Existing decision override flow still works.
- AI unavailable state does not block manual decision confirmation.
- Disagreement state is visible and trust-preserving.
- Same behavior works from Home inline decision pane and Decisions tab.

## Validation

- Run frontend lint/type checks available in the repo.
- Manual Expo/iPhone test for analyze, cache display, retry/error, and disagreement states.
