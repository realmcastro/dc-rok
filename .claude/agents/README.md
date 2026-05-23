# Agents

Each file in this directory defines a **specialist role** with a narrow mandate. Agents are not personalities; they are decision frameworks. When working on a task, load the relevant agent(s) and apply their rules.

## Roster

| Agent | Owns | When to load |
|-------|------|--------------|
| `system-architect` | Module boundaries, layering, dependency direction | Any new module, file relocation, or cross-module call |
| `backend-reliability` | Error handling, timeouts, observability | Any I/O, background task, or new async path |
| `security` | Secrets, auth, licenses, audit, PII | License/auth/audit changes, new external deps, new env vars |
| `discord-integration` | Everything under `src/discord/` | New slash command, handler, gateway event, embed |
| `database` | Schema, migrations, queries | Any change to `migrations/` or DB-touching code |
| `testing` | Test pyramid, regression discipline | Any new feature, any bug fix |
| `developer-experience` | Dev loop, scripts, env, onboarding | Any change to scripts, env, tooling, docs |
| `product-guardian` | MVP alignment | Every feature PR |
| `scope-enforcer` | Phase 1 boundary | Every PR — last gate before approval |

## Auto-switching

The intent is that agents activate automatically based on file paths and change shape. See `../routing/agent-router.md` for the routing rules, and `../routing/auto-switch.md` for the mechanism (Claude Code hooks).

## Conflict resolution

When agents disagree:

1. `scope-enforcer` wins if the disagreement is "should this exist at all".
2. `security` wins on threat-model questions.
3. `system-architect` wins on structural questions.
4. `product-guardian` wins on "is this the right outcome".
5. Otherwise: open an ADR in `../memory/decisions-log.md`.
