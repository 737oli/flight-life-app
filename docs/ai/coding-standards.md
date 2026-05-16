# Coding Standards

## Core Principle

Optimize for code that is easy to understand, easy to test, easy to change, and safe to evolve.

For Flight Life App, "safe to evolve" also means privacy-safe and trust-preserving: never hide planned roster duties, never silently replace roster facts with live data, and never commit private roster artifacts.

## Naming

- Use intention-revealing names.
- Prefer domain language: roster, duty, flight leg, taxi, rest, hotel stay, off day, import, operations, decision, preference.
- Avoid vague labels such as `data`, `item`, or `thing` when a domain term exists.
- Names should reveal side effects when side effects exist.

## Functions

- Functions should do one thing at one level of abstraction.
- Prefer small functions, but do not fragment behavior into shallow wrappers.
- Avoid boolean flag arguments when a named mode or object is clearer.
- Avoid hidden side effects.
- Prefer clear command/query separation.

## Modules

- Prefer deep modules with simple interfaces and meaningful internal behavior.
- Keep parser, import, schedule, operations, decision, persistence, and frontend rendering concerns separated.
- Hide external API details behind backend adapters.
- Keep domain logic out of React components where practical.
- Make dependencies explicit.

## Frontend Standards

- Treat the backend API client as a boundary.
- Keep Settings as the place for backend connection, roster import, import summary, and preferences.
- Keep Home focused on the next 7 days.
- Use compact, readable mobile UI for operational information.
- Cache the last successful schedule response as read-only fallback data.
- Do not store secrets in frontend code or public Expo env values.

## Backend Standards

- Keep parser behavior testable without network calls.
- Use project-owned DTOs between backend and frontend.
- Use SQLAlchemy/Alembic migrations for persistent schema changes.
- Keep uploaded PDFs, SQLite files, logs, and env files in ignored runtime paths.
- Use transactions for imports that modify persistent schedule data.
- Mock AF/KLM calls in tests.

## Comments

- Prefer expressive code over explanatory comments.
- Use comments for intent, constraints, tradeoffs, warnings, and non-obvious domain rules.
- Remove stale, redundant, or commented-out code.

## Refactoring

- Refactor in small behavior-preserving steps.
- Add characterization tests before changing unclear parser behavior.
- Do not mix large refactors with unrelated feature work.

