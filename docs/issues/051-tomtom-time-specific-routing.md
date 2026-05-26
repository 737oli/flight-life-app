# Issue 051: TomTom Time-Specific Routing

## Status

Completed.

## Goal

Ensure TomTom commute estimates are requested for the actual stay-vs-home decision window instead of a generic current route.

## Context

The backend already requested TomTom routes with `departAt`, so AMS-to-home estimates were tied to the planned duty-end departure time. The home-to-AMS route still derived a leave-home time from the configured commute preference and sent that as `departAt`, which is weaker than asking TomTom for the route that arrives at AMS by the next duty start.

## Scope

- Keep AMS-to-home as a `departAt` request using the current duty end.
- Change home-to-AMS to an `arriveAt` request using the next AMS-starting duty start.
- Prevent TomTom requests from sending both `departAt` and `arriveAt`.
- Keep the traffic context DTO compatible by retaining `depart_at` and adding `arrive_at`.
- Keep route-specific commute minutes as the decision input and preserve configured commute fallback behavior.

## Acceptance

- TomTom client tests cover `departAt`, `arriveAt`, and invalid mixed/missing time modes.
- Traffic service tests verify AMS-to-home uses duty-end departure time and home-to-AMS uses next-duty arrival deadline.
- Decision services continue to consume route-specific expected minutes without frontend changes.

## Validation

- `.venv/bin/python -m pytest tests/test_traffic_client.py tests/test_traffic_service.py tests/test_decision_context_service.py tests/test_decision_service.py`
