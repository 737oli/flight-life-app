# Shared Docs Workflow

## Goal

Keep one practical source of truth for project docs while still committing those docs into both GitHub repositories so Copilot can reference them.

## Source Of Truth

The canonical shared docs live in the backend repo:

- `flight-life-app-server/AGENTS.md`
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

## Rules

- Do not hand-edit the same shared docs separately in both repos.
- Do not sync `.DS_Store`, private roster PDFs, runtime logs, parsed real roster outputs, or secrets.
- If a docs change is frontend-only or backend-only, keep it in a repo-specific file outside the shared docs set.
- The workspace-root docs are local convenience copies only unless intentionally refreshed from the backend source.
