-- Roles per ADR-0013 (append-only audit at the DB role level).
--
-- dcrok_owner       — superuser-ish role used for migrations and admin ops. Created by Postgres image.
-- dcrok_app         — runtime role used by the bot. Cannot UPDATE/DELETE audit_logs.
-- dcrok_audit_read  — read-only role for audit consumers (dashboards, exports).

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dcrok_app') THEN
        CREATE ROLE dcrok_app LOGIN PASSWORD 'dcrok_app_password';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dcrok_audit_read') THEN
        CREATE ROLE dcrok_audit_read LOGIN PASSWORD 'dcrok_audit_read_password';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE dcrok TO dcrok_app, dcrok_audit_read;
GRANT USAGE ON SCHEMA public TO dcrok_app, dcrok_audit_read;

-- Default privileges so future tables created by the owner are usable by the app role
ALTER DEFAULT PRIVILEGES FOR ROLE dcrok_owner IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dcrok_app;

ALTER DEFAULT PRIVILEGES FOR ROLE dcrok_owner IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO dcrok_app;

-- The audit-specific lockdown (revoke UPDATE/DELETE on audit_logs from dcrok_app)
-- is applied by a post-migration step. See docker/postgres/init/02-audit-grants.sql.
