# Code Review Instructions

Review the diff as a human senior engineer would. Prioritize trust, privacy, correctness, and feedback loops.

## Check Correctness

- Does the change satisfy the issue acceptance criteria?
- Does it preserve the roster PDF as planned source of truth?
- Does live data remain an annotation rather than a silent replacement?
- Are off days and unknown duties still visible?
- Are date, time, timezone, and rollover cases handled intentionally?
- Are partial imports rejected or applied only with explicit warnings?
- Does failed import behavior leave existing data intact?

## Check Privacy

- No real roster PDFs committed.
- No parsed real roster output committed.
- No crew names, employee identifiers, private roster text, or screenshots committed.
- No AF/KLM credentials or `.env` files committed.
- Logs and runtime files remain ignored.
- Tests use sanitized synthetic fixtures.

## Check Design

- Is this a vertical slice or an incomplete horizontal layer?
- Is core logic in the right backend service/module?
- Are parser, import, schedule, operations, decision, and frontend responsibilities separated?
- Are interfaces clear and minimal?
- Is there unnecessary coupling between frontend UI and backend internals?
- Does persistence use migrations instead of ad hoc schema edits?

## Check Tests

- Are tests behavior-focused?
- Are parser changes covered by characterization or regression tests?
- Are import merge and rollback cases covered?
- Are operations API calls mocked?
- Are frontend tests added where tooling exists?
- Are important edge cases included?

## Check Deployment

- Does Docker/Compose state live in volumes?
- Are Pi/Tailscale assumptions documented?
- Is public exposure avoided unless auth/security is part of the issue?

## Output Format

Use this structure:

1. Summary
2. Blocking issues
3. Non-blocking suggestions
4. Tests/checks run
5. Remaining risks

