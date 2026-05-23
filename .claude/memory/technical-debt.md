# Technical Debt

Conscious, recorded debt only. Anything we know is suboptimal but accepted for Phase 1 is listed here with its compensating control and a removal trigger.

Anything **unknown** debt is not debt yet — it is risk. Risks go in `known-risks.md`.

## Format

```
### TD-NNNN — <short title>

Recorded: YYYY-MM-DD
Owner: <role or person>
Status: open | in-progress | cleared (PR #...)

What: <one paragraph>
Why we accept it now: <one paragraph>
Cost of clearing: <effort estimate>
Trigger to clear: <event or threshold>
Compensating control: <what protects us while it is open>
```

## Open debt

### TD-0001 — Admin allow-list is a static env var

Recorded: 2026-05-23
Owner: security agent
Status: open

What: Admin Discord IDs are configured via an env var (`ADMIN_DISCORD_IDS`, comma-separated), parsed by `src/config/`. There is no admin-management command.

Why we accept it now: Phase 1 has at most a handful of admins; adding admin-management commands enlarges the attack surface and the surface area.

Cost of clearing: ~1-2 days; requires a permission domain and audit treatment of admin grants.

Trigger to clear: We add a second deployment with different admins, OR we cross 5 admins.

Compensating control: Allow-list changes require a deploy. Every admin action is audited.

### TD-0002 — License keys hashed with a single algorithm

Recorded: 2026-05-23
Owner: security agent
Status: open

What: License keys at rest are hashed with one algorithm (chosen at first migration; documented in the migration comment). No support for algorithm rotation.

Why we accept it now: Phase-1 scale and threat model do not require rotation.

Cost of clearing: ~2 days; add a `hash_version` column and a verifier that picks the algorithm per row.

Trigger to clear: Industry standards shift, OR a compromise scenario forces re-hash.

Compensating control: Hash choice is documented in `decisions-log.md`. Verifier is centralized.

### TD-0003 — No metrics backend

Recorded: 2026-05-23
Owner: backend-reliability agent
Status: open

What: We rely on structured logs to derive latency and outcome metrics. No Prometheus/OpenTelemetry pipeline.

Why we accept it now: Phase-1 volume is low; logs are sufficient.

Cost of clearing: ~3-5 days; choose backend, add SDK, instrument key paths.

Trigger to clear: Interaction volume exceeds ~10k/day, OR ops complains about derived-from-logs visibility.

Compensating control: Required log fields make derivation straightforward.

### TD-0004 — No DM channel from the bot

Recorded: 2026-05-23
Owner: discord-integration agent
Status: open

What: The bot replies in the channel of the interaction. We do not DM users when state changes asynchronously (e.g., license expires).

Why we accept it now: Phase 1 has no scheduled tasks beyond expiry, and users discover expiry on next interaction.

Cost of clearing: ~1-2 days; user opt-in flow, DM-channel cache, rate-limited push.

Trigger to clear: Product feedback indicates users miss expiries.

Compensating control: `/status` shows expiry prominently; embed colors signal state.

## Cleared debt

(empty)

## Rules

- Do not add to this file casually. Debt is intentional and reviewed.
- Every entry has a removal trigger.
- Reviewers can ask: "is this Phase-1 acceptable?" — if no, the entry doesn't belong here; fix the code.
