# Known Risks

Risks are things that could go wrong. Some have compensating controls; some are accepted.

## Format

```
### R-NNNN — <short title>

Recorded: YYYY-MM-DD
Likelihood: low | medium | high
Impact: low | medium | high
Status: open | mitigated | accepted | retired

What: <one paragraph>
Why it matters: <one paragraph>
Mitigation: <controls in place or planned>
Detection: <how we would know it happened>
Owner: <agent or role>
```

## Open risks

### R-0001 — Activation code brute-force

Recorded: 2026-05-23
Likelihood: medium
Impact: high
Status: open (mitigated)

What: An attacker with many Discord accounts could try activation codes against `/init`.

Why it matters: A successful guess binds an unauthorized Discord user to a license.

Mitigation:
- Activation codes are high-entropy (≥ 128 bits effective).
- Per-user and per-IP-ish (Discord side) rate limit on `/init`.
- Audit on every redemption attempt, successful or not.
- Codes expire if unused past a configurable TTL.

Detection: Sustained `audit.action='code.redeem' AND outcome='reject'` from a single actor.

Owner: security agent.

### R-0002 — Discord token compromise

Recorded: 2026-05-23
Likelihood: low
Impact: high
Status: open (mitigated)

What: The bot's Discord token is leaked (e.g., env exposure, dependency compromise).

Why it matters: An attacker can impersonate the bot, send messages, register commands.

Mitigation:
- Token only in env; `process.env` reads gated to `src/config/`.
- Lint rule forbids token-shaped strings in code.
- Token rotation procedure documented in `release-process.md`.
- No third-party dep handles the token unless ADR-approved.

Detection: Discord developer portal "regenerate" page; ops procedure; anomalous gateway sessions.

Owner: security agent.

### R-0003 — DB role drift (audit no longer append-only)

Recorded: 2026-05-23
Likelihood: low
Impact: high
Status: open (mitigated)

What: A DB migration or deploy script grants the app role `UPDATE`/`DELETE` on `audit_logs`.

Why it matters: Audit integrity is the project's primary forensic surface.

Mitigation:
- Deploy script asserts current grants and aborts if `app_role` has anything beyond `INSERT, SELECT` on `audit_logs` (SELECT only if explicitly enabled).
- Audit-grant changes require a security-agent reviewed ADR.

Detection: Startup health check queries `information_schema` for grants.

Owner: database agent + security agent.

### R-0004 — Slash-command drift

Recorded: 2026-05-23
Likelihood: medium
Impact: medium
Status: open (mitigated)

What: The set of commands registered against Discord drifts from the code (extra commands left over from past dev iterations).

Why it matters: Old commands respond unexpectedly; UX gets confusing.

Mitigation:
- Registration is **declarative**: we read the desired command set from code and `set` (not `add`) it on the application at startup.
- Per-guild dev registration is wiped on each dev run.

Detection: Startup logs include the registered command count; a mismatch with code triggers `warn`.

Owner: discord-integration agent.

### R-0005 — Phase-2 creep

Recorded: 2026-05-23
Likelihood: medium
Impact: high
Status: open (mitigated)

What: Phase-2 capabilities (automation, OCR, etc.) sneak in under different names.

Why it matters: Phase-1 scope is the project's main risk control. Drift here is a quality and timeline risk.

Mitigation:
- `scope-enforcer` agent blocks PRs adding banned dependencies or named modules.
- `architecture-decisions.md` pins the boundary.
- `future-roadmap.md` is the legitimate place for Phase-2 conversation.

Detection: `package.json` diff includes a banned library; new file under a Phase-2-named module.

Owner: scope-enforcer + product-guardian.

### R-0006 — Migration left half-applied in production

Recorded: 2026-05-23
Likelihood: low
Impact: high
Status: open (mitigated)

What: A migration fails partway. The DB is inconsistent with code.

Why it matters: Hard to recover; data risk.

Mitigation:
- Migrations are reviewed by the database agent.
- CI runs migrations against a fresh DB on every PR.
- Destructive operations are two-release.
- Backups verified before any destructive migration.

Detection: Deploy step fails; health check rejects schema mismatch.

Owner: database agent.

## Accepted risks

(empty)

## Retired risks

(empty)
