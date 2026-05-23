# Auto-Switching Agents

How the project automatically loads the right specialist agent(s) for each task without the human having to remember.

## Mechanism

The auto-switching is wired through **Claude Code hooks**, declared in `.claude/settings.json`. Two hooks are used:

| Hook | Trigger | What it does |
|------|---------|--------------|
| `UserPromptSubmit` | When the human sends a prompt | Runs `.claude/hooks/inject-agents.mjs` which matches the prompt and recent `git diff` against the routing table and injects a `<system-reminder>` listing the activated agent files. |
| `PreToolUse` (Edit, Write) | Before a file is edited or written | Runs `.claude/hooks/check-paths.mjs` which matches the target path against path triggers and emits a reminder if a specialist agent owns that path. |

Both hooks are **non-blocking advisories**. They surface context; they do not stop edits. The assistant is expected to honor them; reviewers verify in PR review.

## Files

```
.claude/
  settings.json                  hook registration (Claude Code reads this)
  hooks/
    inject-agents.mjs            prompt-time agent matcher
    check-paths.mjs              edit-time path matcher
  routing/
    agent-router.md              the routing table (this file's sibling)
    auto-switch.md               (this file)
```

## What the assistant sees

When a user asks: *"Add a new repository under `src/license/infrastructure/`"*, the hook injects:

```
<system-reminder>
Activated agents for this change:
- system-architect (new file at module boundary)
- database (file matches `src/**/infrastructure/**.repository.ts`)
- security (path under `src/license/**`)
- backend-reliability (likely adds I/O)
- testing (every PR)
- product-guardian (every feature PR)
- scope-enforcer (every PR)

Load `.claude/agents/<name>.md` for each before planning.
</system-reminder>
```

The assistant must:

1. Read each activated agent file.
2. Apply its hard rules during planning.
3. Apply its validation criteria before finishing.
4. List the activated agents in the PR description.

## Manual override

To force an agent for a task that does not naturally trigger it:

```
prompt: ... [agents: security, system-architect]
```

The matcher honors an `[agents: ...]` list in the prompt and unions it with the auto-matched set.

To **suppress** an automatic activation (rare; requires justification):

```
prompt: ... [skip-agents: testing]   reason: docs-only change
```

The matcher records the skip in the session log so reviewers can audit.

## Failure modes the auto-switcher must avoid

- **Over-activation**: triggering every agent on every prompt buries the signal. Triggers are path/content specific.
- **Under-activation**: missing a security-relevant change. The path triggers err on the side of activating `security` for any `license`/`audit`/`config` path.
- **Stale routing table**: when an agent or path changes, `routing/agent-router.md` must be updated **in the same PR**. The `system-architect` agent reviews routing changes.

## Adding a new agent

1. Add the agent file in `.claude/agents/<name>.md`.
2. Add a row in `routing/agent-router.md`.
3. Update `.claude/agents/README.md`.
4. Run a dry-test: a sample prompt should activate the new agent.
5. ADR if the agent has veto power.

## Tooling outside Claude Code

For contributors not using Claude Code (e.g., reviewing via the GitHub web UI), the routing table is enforced manually using the same `agent-router.md`. The PR template (`.github/pull_request_template.md`) — to be added during implementation — should include a "Activated agents" section the author fills in.
