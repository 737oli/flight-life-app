# Issue 052: Decisions Full Roster Horizon

## Status

Completed.

GitHub: https://github.com/737oli/flight-life-app/issues/20

## Goal

Show all current and future stay-vs-home decision candidates in the Decisions tab for the imported roster period, not only candidates inside Home's next-7-days schedule window.

## Context

The Decisions tab currently loads `GET /schedule/next-7-days`, filters the returned days for AMS-ending flight duties, then fetches each stay-vs-home decision. That matches Home's short horizon, but it hides valid decisions later in the imported roster. The user expects the Decisions tab to be the place where every upcoming decision is visible.

Home should remain focused on the next 7 days. Calendar should remain a full roster agenda. This issue changes the Decisions tab horizon only.

## Scope

- Load the current imported roster period for the Decisions tab.
- Use the existing date-range schedule API (`GET /schedule?start_date=...&end_date=...`) to fetch the full current roster period, unless implementation proves a dedicated backend decision-list endpoint is necessary.
- Filter decision candidates with the same rule as Home and Calendar:
  - only flight days ending in the configured home base, currently AMS;
  - no outstation-ending stay-vs-home decisions;
  - no off-day or non-flying duty decisions.
- Show current and future decision candidates in date order.
- Keep existing decision cards, TomTom commute reasoning, AI advisor panel, manual override confirmation, and save-error behavior.
- Update the Decisions subtitle and empty state so it no longer says "next 7 days".
- Keep Home and its cache behavior unchanged.

## Acceptance

- If an imported roster has an AMS-ending flight day beyond day 7, that decision appears in the Decisions tab.
- Decisions tab does not show outstation-ending flight days.
- Decisions tab remains ordered by roster date and does not reorder duties based on live, traffic, weather, or AI data.
- Confirmed, needed, and needs-review decisions all stay visible for upcoming roster-period candidates.
- Empty state says there are no upcoming AMS-ending decision days in the current roster, not that there are none in the next 7 days.
- Home continues to show only next-7-days inline decision references.

## Test Plan

- Add or update frontend behavior tests for selecting Decisions tab candidate days from a full schedule range.
- Add or update backend API-client tests if the Decisions tab uses a new current-roster/import metadata call or changes date-range schedule usage.
- Run frontend focused tests for decision presentation/API behavior.
- Run `npm run typecheck`.
- Manual QA:
  - import a roster with an AMS-ending duty after the first 7 days;
  - confirm the later decision appears in Decisions;
  - confirm Home still shows only next 7 days;
  - confirm manual override still works from the later decision card.

## Notes

- This issue should not change the backend deterministic decision rules.
- If the frontend fan-out over all roster-period candidates becomes too slow, create a follow-up backend endpoint that returns a compact decision list for a date range.

## Implementation Notes

- Added `services/decisionSchedule.ts` to derive the current/future roster decision range from the current import metadata.
- Updated the Decisions tab to seed from `/schedule/next-7-days`, fetch the current/future import period with `/schedule`, and then fetch traffic-aware stay-vs-home decisions for upcoming AMS-ending flight days.
- Kept Home unchanged on the next-7-days horizon.
- Updated Decisions copy so it refers to upcoming decisions in the current roster rather than the next 7 days.

## Validation

- `npm run test -- --runTestsByPath services/__tests__/decisionSchedule.test.ts services/__tests__/backendApi.test.ts services/__tests__/decisionPresentation.test.ts`
- `npm run typecheck`
