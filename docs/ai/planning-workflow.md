# Planning Workflow For AI Coding

## Goal

Plan work so Codex stays inside small, reviewable, testable vertical slices.

## Workflow

1. Clarify the request.
2. Identify assumptions and unresolved questions.
3. Inspect the existing code before proposing changes.
4. Define the destination: what should be true when done?
5. Break work into vertical slices.
6. Prefer one slice per task.
7. Implement with tests where tooling exists.
8. Run feedback loops.
9. Review the diff.
10. Add follow-up issues instead of letting one session sprawl.

## Flight Life Planning Rules

- Keep the roster PDF as the planned source of truth.
- Treat live operations data as enrichment only.
- Put upload/import maintenance flows in Settings.
- Keep Home focused on the next 7 days.
- Preserve data outside imported roster periods.
- Keep real roster PDFs local and ignored.
- Use synthetic fixtures for committed tests.
- Keep backend and frontend repos separate.
- Do not mix public deployment/security work into private Tailscale deployment slices.

## Vertical Slice Rule

Prefer changes that cross the necessary layers minimally:

- data/model change if needed;
- service/domain logic;
- API/interface;
- UI/consumer;
- test coverage.

Avoid doing all database work first, then all API work, then all UI work unless an explicit foundation issue requires it. When a foundation issue is needed, keep it narrow and make the next visible slice obvious.

## Task Sizing

A good Codex task should be:

- small enough to review in one sitting;
- covered by focused tests where practical;
- reversible if wrong;
- independently useful or visibly closer to the first milestone;
- free of private committed data.

