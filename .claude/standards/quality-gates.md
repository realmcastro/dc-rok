# Quality Gates

A list of gates a change must pass. Gates are **automated where possible** and **enforced manually** otherwise.

## Local gates (developer's machine, pre-commit)

| Gate | Tool | When |
|------|------|------|
| Formatter | Prettier (via `lint-staged`) | On staged files at commit |
| Linter | ESLint | On staged files at commit |
| Type check | `tsc --noEmit` | Pre-push |
| Unit tests | Vitest | Pre-push |

Wired through Husky: `prepare-commit-msg`, `pre-commit`, `pre-push`.

## CI gates (GitHub Actions)

| Gate | Mandatory | Description |
|------|-----------|-------------|
| Install | yes | `npm ci` clean |
| Lint | yes | `npm run lint` |
| Type check | yes | `npm run typecheck` |
| Unit tests | yes | `npm run test:unit` |
| Integration tests | yes | `npm run test:int` (with a test Postgres) |
| Smoke E2E | yes | `npm run test:e2e:smoke` |
| Build | yes | `npm run build` |
| Audit (deps) | yes | `npm audit --audit-level=high` |
| Migration up | yes | `npx prisma migrate deploy` on fresh DB |
| Migration replay | yes | Drop DB → re-apply all migrations → compare schema |
| Bundle size | no | If a bundler is used |
| Coverage report | no | Heuristic; not a gate |

A PR with any **mandatory** CI gate red is unmergeable.

## Manual gates (agent-enforced)

| Gate | Agent | When |
|------|-------|------|
| Scope check | `scope-enforcer` | Every PR |
| Architecture check | `system-architect` | PRs touching module structure |
| Security check | `security` | PRs touching `license`, `auth`, `audit`, `config`, deps |
| Database check | `database` | PRs under `prisma/` or DB adapters |
| Discord check | `discord-integration` | PRs under `src/discord/` |
| Reliability check | `backend-reliability` | PRs adding I/O or async paths |
| Testing check | `testing` | Every PR |
| Product check | `product-guardian` | Every feature PR |
| DX check | `developer-experience` | PRs to scripts/env/tooling |

## Release gates

In addition to all of the above:

- [ ] `/security-review` executed and findings addressed.
- [ ] Manual smoke test against staging.
- [ ] DB backup verified.
- [ ] `CHANGELOG.md` updated.

## Gate bypass

There is no bypass. If a gate is wrong, **change the gate** in a dedicated PR. Do not skip it.

## Enforcement of "no bypass"

- Husky hooks should not be skipped via `--no-verify`. The hook configuration logs every skip; the `developer-experience` agent reviews skipped commits.
- `--no-verify` is forbidden by the `coding-rules.md`. A commit with a skipped hook is a violation; investigate, fix root cause, recommit.
