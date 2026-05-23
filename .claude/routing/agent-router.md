# Agent Router

Deterministic rules for **which agent activates** based on the files being changed and the shape of the request. Read by the AI assistant on every task; enforced by the prompt-injected context produced by `.claude/hooks/inject-agents.mjs`.

## Triggering layers

An agent activates when **any** of its triggers fires:

1. **Path triggers** — file globs touched by the change.
2. **Content triggers** — substrings in the diff or in the user prompt.
3. **Phase triggers** — events in the workflow (e.g., release, migration, security review).

Multiple agents may activate at once. The conflict order in `agents/README.md` resolves disagreements.

## Routing table

| Agent | Path triggers | Content triggers | Phase triggers |
|-------|---------------|------------------|----------------|
| `scope-enforcer` | `package.json`, `src/**/automation*`, `src/**/agent-runtime*`, `src/**/task-stream*`, `src/**/telemetry-sink*` | `puppeteer`, `playwright`, `tesseract`, `robotjs`, `nut-js`, `screenshot`, `OCR`, `macro` | every PR |
| `product-guardian` | (none specific) | "feature", "add command", "new flow" | every feature PR |
| `system-architect` | `src/**/index.ts`, `src/bootstrap/**`, files added across modules | `import` (cross-module), `new module`, `port`, `adapter` | new file added |
| `discord-integration` | `src/discord/**` | `interaction`, `slash command`, `embed`, `intent` | command registration changes |
| `database` | `prisma/**`, `src/**/infrastructure/**.repository.ts`, `migrations/**` | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `ALTER`, `CREATE TABLE`, `prisma.` | any schema diff |
| `security` | `src/license/**`, `src/account-link/**`, `src/audit/**`, `src/config/**`, `package.json` | `process.env`, `token`, `secret`, `bcrypt`, `crypto`, `hash`, `compare` | dependency change, secret rotation |
| `backend-reliability` | files with `async` in diff, `src/**/infrastructure/**` | `await`, `setTimeout`, `setInterval`, `retry`, `Promise.race`, `fetch(`, `axios`, `prisma.` | new I/O path |
| `testing` | `**/*.test.ts`, `**/*.int.test.ts`, `tests/**` | `it(`, `describe(`, `expect(` | every PR |
| `developer-experience` | `package.json`, `scripts/**`, `.env.example`, `Dockerfile`, `docker-compose.yml`, `README.md`, `.husky/**`, `.github/workflows/**` | "onboarding", "setup", "dev loop" | tooling change |

## Default activations

Some agents activate on **every PR** regardless of file content:

- `scope-enforcer` — last gate.
- `product-guardian` — every feature PR.
- `testing` — proportional to risk.

## Activation output

When an agent activates, the assistant must:

1. Read that agent's file (`.claude/agents/<name>.md`) into working context.
2. Apply its **hard rules** and **anti-patterns** during planning.
3. Apply its **validation criteria** before declaring the task done.
4. Cite the agent by name in the PR description (e.g., "system-architect ✅, security ✅").

## Disabling an agent

An agent activation can be disabled **only** by an ADR. Disable in code reviews is not permitted.

## Mechanism

Routing is wired through two Claude Code hooks:

- `UserPromptSubmit` → `.claude/hooks/inject-agents.mjs` reads the user prompt and recent diff, matches the routing table, and injects a system reminder listing the activated agents.
- `PreToolUse` (for `Edit`/`Write`) → `.claude/hooks/check-paths.mjs` matches the target path against the table and emits a reminder before the edit lands.

See `.claude/routing/auto-switch.md` for the wiring details and `.claude/settings.json` for the hook configuration.
