# Issue 003: SQLite Persistence Foundation With SQLAlchemy And Alembic

## Status

Done.

## Goal

Add durable backend persistence for roster imports, parsed schedule data, preferences, and manual decisions.

## Why

The app needs date-scoped imports, fallback data, preferences, and decision preservation. SQLite is lightweight enough for a private Raspberry Pi app, while migrations prevent local schema drift.

## Scope

- Add SQLAlchemy setup.
- Add Alembic migration setup.
- Define first persistence models for import metadata and parsed schedule records.
- Add local SQLite path configuration.
- Ensure database files are ignored.
- Add tests for database setup and basic persistence.

## Out Of Scope

- Do not implement upload API.
- Do not implement full schedule DTO yet.
- Do not implement decisions yet.

## Acceptance Criteria

- Backend can create a local SQLite database through migrations.
- Database location is configurable for tests and runtime.
- Generated database files are ignored.
- Tests use temporary SQLite databases.

## Validation

- Run migration command.
- Run backend persistence tests.
