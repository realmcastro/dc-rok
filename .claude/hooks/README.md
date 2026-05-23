# Hooks

Read-only Claude Code hooks that implement agent auto-switching. They print `<system-reminder>` blocks; they never modify files or run other tools.

## Files

- `inject-agents.mjs` — `UserPromptSubmit` hook. Matches the prompt + `git diff` against `../routing/agent-router.md` and lists activated agents.
- `check-paths.mjs` — `PreToolUse` hook for `Edit`/`Write`/`MultiEdit`. Matches the target path and lists agents that own it.

Both scripts:

- Read **stdin** (JSON from Claude Code).
- Write **stdout** (the `<system-reminder>` injected into context).
- Do not touch the filesystem.
- Do not call other commands except `git diff --name-only HEAD` and `git ls-files --others --exclude-standard` (read-only).

## Enabling

The hooks are **not active** until they are registered in `.claude/settings.json`. To enable:

1. Review `../routing/settings.example.json`.
2. Copy it to `.claude/settings.json`.
3. Adjust the permissions block to fit your environment (the example does not include broad permissions on purpose).
4. Restart Claude Code so it re-reads settings.

## Verifying

After enabling, send a prompt like:

```
Add a new repository under src/license/infrastructure/
```

You should see a system reminder activating `security`, `database`, `backend-reliability`, `system-architect`, `testing`, `product-guardian`, `scope-enforcer`.

Edit a file under `src/discord/` and you should see `discord-integration` listed by the `PreToolUse` hook.

## Disabling temporarily

Remove the two `hooks` entries from `.claude/settings.json` (or comment them out). The agent files remain readable; only the auto-injection stops.

## Maintenance

When agents or routing rules change, update **both**:

- `../routing/agent-router.md` (the human-readable table).
- The `ROUTES` array in `inject-agents.mjs` and the `PATH_RULES` array in `check-paths.mjs`.

A test in CI should diff the two and fail on drift (TODO during implementation).
