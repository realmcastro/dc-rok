# Product Context

## Users

| User | Persona | What they do |
|------|---------|--------------|
| End user | A Discord user who paid for or was granted access | Links their account, activates a license, checks status |
| Admin | Trusted operator (allow-listed Discord IDs) | Issues licenses, revokes licenses, queries audit |
| System | The bot itself | Expires licenses, writes audit entries, surfaces state |

## Surface

A single Discord application with the following commands. The list is **closed** for Phase 1.

| Command | Who | What it does (Phase 1) |
|---------|-----|------------------------|
| `/init code:<activation_code>` | End user | Validate code → bind Discord user to an Account → mark session/device → audit |
| `/start` | End user | Validate license + link → set session `ACTIVE` (no real automation runs) → audit |
| `/stop` | End user | Set session `STOPPED` → audit |
| `/status` | End user | Render a status card (account, session state, license, expiry, uptime, last start/stop, health) |
| `/reset` | End user (confirmed) | Unlink account → invalidate session → clear state → keep audit |

Admin commands exist for license management but are out of the standard end-user surface. They are scoped to allow-listed Discord IDs and are detailed in `domain-map.md` and `architecture-decisions.md`.

All replies that mention secrets or activation codes are ephemeral. All non-trivial actions produce audit entries.

## State model (intent)

- `accounts`: internal account; one row per managed game-account. Holds optional `discord_user_id` when linked.
- `licenses`: issued licenses with `status`, `expires_at`, `max_activations`, `current_activations`, `created_by`.
- `activation_codes`: one-time-use (or N-use) codes bound to a license, redeemed via `/init`.
- `automation_sessions`: account session intent (`IDLE`/`ACTIVE`/`STOPPED`), with `started_at`, `stopped_at`.
- `audit_logs`: append-only log of state changes (`actor`, `action`, `payload`, `timestamp`, `correlation_id`).

## Constraints

- Discord interactions must complete within 3 seconds or be deferred.
- Discord rate limits apply per route; the client library handles them; we do not work around them.
- License keys must be safe to display only to the issuing user, only at issuance.
- Audit history must be queryable by `actor`, `target`, and `time window`.

## Failure modes the product must handle

- A Discord user activates a license that is already taken → friendly error, audited.
- A Discord user reaches `/status` before linking → friendly prompt, not an error.
- A Discord user is offline when their license expires → next interaction reflects expiry; no DM spam.
- The database is unreachable → user-facing message says "try again", with correlation id; logged at `error`.

## What we do not promise in Phase 1

- DMs from the bot. The bot replies in the channel the command came from.
- Real-time push to the user when state changes. The user discovers changes when they next interact.
- Web dashboard. Discord is the only UI.

## Source of truth

- License state: the database.
- Identity: Discord, materialized into `users` + `account_links`.
- Audit: the `audit_events` table.

When in doubt about a product question, default to: simpler, more auditable, more ephemeral.
