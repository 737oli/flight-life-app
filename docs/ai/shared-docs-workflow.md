# Shared Docs Workflow

## Goal

Keep one practical source of truth for project docs while still committing those docs into both GitHub repositories so Copilot can reference them.

## Source Of Truth

The canonical shared docs live in the backend repo:

- `flight-life-app-server/AGENTS.md`
- `flight-life-app-server/CURRENT_STATUS.md`
- `flight-life-app-server/PROJECT_CONTEXT.md`
- `flight-life-app-server/docs/`

The frontend repo contains a synced copy for repo-local context.

## Update Flow

1. Edit shared docs in `flight-life-app-server/`.
2. Run the sync command from the workspace:

   ```bash
   flight-life-app-server/scripts/sync-shared-docs.sh
   ```

3. Review `git status` in both child repositories.
4. Commit and push the backend docs/source changes.
5. Commit and push the frontend synced docs changes.

## Preview Sync

Use dry-run mode before a larger docs cleanup:

```bash
flight-life-app-server/scripts/sync-shared-docs.sh --dry-run
```

## Freshness Checklist

Before finishing a shared-docs milestone:

1. Update `CURRENT_STATUS.md`.
2. Keep `docs/product/flight-life-app-kanban.md` focused on active and next work.
3. Move completed milestone detail into `docs/product/milestones-history.md`.
4. Update `docs/product/api-contracts.md` when endpoint behavior or frontend consumers change.
5. Update `docs/issues/README.md` when issue status or grouping changes.
6. Run the shared-docs sync script.
7. Run the stale-text scan and inspect each hit:

   ```bash
   rg -n "No committed test suite exists yet|Component test tooling is not set up yet|next planned work is|Status: .*Ready|port 8000|http://127.0.0.1:8000" \
     --glob '!docs/ai/shared-docs-workflow.md' \
     AGENTS.md CURRENT_STATUS.md PROJECT_CONTEXT.md README.md docs
   ```

The scan is intentionally conservative. It may find legitimate historical issue text, but current-status files, README files, and active planning docs should not contradict the implemented state.

## Rules

- Do not hand-edit the same shared docs separately in both repos.
- Do not sync `.DS_Store`, private roster PDFs, runtime logs, parsed real roster outputs, or secrets.
- If a docs change is frontend-only or backend-only, keep it in a repo-specific file outside the shared docs set.
- The workspace-root docs are local convenience copies only unless intentionally refreshed from the backend source.
