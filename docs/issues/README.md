# Flight Life App Issue Drafts

These files are GitHub issue drafts and implementation records for Flight Life App work.

Use [Current Status](../../CURRENT_STATUS.md) for current state and [Kanban](../product/flight-life-app-kanban.md) for active planning. Completed milestone context lives in [Milestones History](../product/milestones-history.md).

## Publishing Targets

- `737oli/flight-life-app-server` for backend, deployment, and canonical shared-docs work.
- `737oli/flight-life-app` for frontend work.
- Cross-repo docs start in the backend repo, then sync into the frontend repo.

## Active Or Manual Validation

- [023 - Tailscale Raspberry Pi smoke test](023-tailscale-pi-smoke-test.md) - needs manual validation.
- [052 - Decisions full roster horizon](052-decisions-full-roster-horizon.md) - ready.

## Completed Drafts

- [001 - Backend test harness and project hygiene](001-backend-test-harness.md)
- [002 - Parser characterization with private PDF and synthetic fixtures](002-parser-characterization.md)
- [003 - SQLite persistence foundation with SQLAlchemy and Alembic](003-sqlite-persistence-foundation.md)
- [004 - Roster upload endpoint with atomic parse validation](004-roster-upload-endpoint.md)
- [005 - Date-scoped roster import merge and import summary](005-date-scoped-import-merge.md)
- [006 - Stable schedule DTO and next-7-days API](006-schedule-dto-api.md)
- [007 - Frontend backend configuration and connection status](007-frontend-backend-config.md)
- [008 - Settings roster import UI](008-settings-roster-import-ui.md)
- [009 - Home 7-day dashboard from backend data with fallback cache](009-home-dashboard-backend-data.md)
- [010 - Raspberry Pi Docker Compose backend deployment](010-raspberry-pi-compose-deployment.md)
- [011 - Backend preferences model and Settings integration](011-preferences-model-settings.md)
- [012 - Deterministic stay-vs-home decision engine](012-stay-vs-home-decision-engine.md)
- [013 - AF/KLM FlightStatus backend client](013-afklm-flightstatus-client.md)
- [014 - 90-minute operations enrichment API](014-operations-enrichment-api.md)
- [015 - Frontend operations chips and detail panel](015-frontend-operations-ui.md)
- [016 - README and deployment documentation refresh](016-readme-deployment-docs.md)
- [017 - Real roster parser QA and sanitized fixture capture](017-real-roster-parser-qa.md)
- [018 - Improve flight leg extraction and day assignment](018-improve-flight-leg-extraction.md)
- [019 - Parser completeness validation and import summary refinement](019-parser-completeness-import-summary.md)
- [020 - Fix parser omission of first two flight legs per duty day](020-fix-missing-first-flight-legs.md)
- [021 - Frontend tab route cleanup](021-frontend-tab-route-cleanup.md)
- [022 - Expo SDK compatibility refresh](022-expo-sdk-compatibility-refresh.md)
- [024 - Operations data retention and departure superscript QA](024-operations-data-retention-and-departure-superscript.md)
- [025 - Frontend stay-vs-home decision integration](025-frontend-stay-vs-home-decisions.md)
- [026 - Home next decision summary](026-home-next-decision-summary.md)
- [027 - Decision manual override action reliability](027-decision-manual-override-action.md)
- [028 - Home inline AMS decision placement](028-home-inline-ams-decision-placement.md)
- [029 - Schedule date-range API](029-schedule-date-range-api.md)
- [030 - Mobile calendar agenda tab](030-mobile-calendar-agenda-tab.md)
- [031 - TomTom traffic provider foundation](031-tomtom-traffic-provider-foundation.md)
- [032 - Decision context builder for advisor data](032-decision-context-builder.md)
- [033 - OpenAI structured decision advisor endpoint](033-openai-structured-decision-advisor.md)
- [034 - AI advisor panel](034-ai-advisor-panel.md)
- [035 - Open-Meteo weather context for decisions](035-open-meteo-weather-context.md)
- [036 - Document calendar and AI decision architecture](036-document-calendar-ai-decision-architecture.md)
- [037 - Backend import history and source PDF cleanup API](037-backend-import-history-source-pdf-cleanup.md)
- [038 - Settings current roster and import history UI](038-settings-current-roster-import-history-ui.md)
- [039 - Roster import history docs and QA checklist](039-roster-import-history-docs-qa.md)
- [040 - Shared docs operating model refresh](040-shared-docs-operating-model.md)
- [041 - Frontend behavior test foundation](041-frontend-behavior-test-foundation.md)
- [042 - Backend operational readiness endpoint](042-backend-operational-readiness-endpoint.md)
- [043 - Settings operational readiness panel](043-settings-operational-readiness-panel.md)
- [044 - Frontend lint warning cleanup](044-frontend-lint-warning-cleanup.md)
- [045 - Frontend backend API client tests](045-frontend-backend-api-client-tests.md)
- [046 - Roster parser layout reliability](046-roster-parser-layout-reliability.md)
- [047 - Settings source PDF delete action reliability](047-settings-source-pdf-delete-action.md)
- [048 - Real roster batch QA and text false positive guard](048-real-roster-batch-qa-text-false-positive-guard.md)
- [049 - Settings local data reset](049-settings-local-data-reset.md)
- [050 - TomTom commute in Decisions](050-tomtom-commute-in-decisions.md)
- [051 - TomTom time-specific routing](051-tomtom-time-specific-routing.md)

## Ready Drafts

- [052 - Decisions full roster horizon](052-decisions-full-roster-horizon.md)

## QA References

- [Roster import history QA checklist](../product/roster-import-history-qa.md)
