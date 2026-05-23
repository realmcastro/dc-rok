-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'UNLINKED');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SessionState" AS ENUM ('IDLE', 'ACTIVE', 'STOPPED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" VARCHAR(26) NOT NULL,
    "external_account_name" TEXT NOT NULL,
    "discord_user_id" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'UNLINKED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" VARCHAR(26) NOT NULL,
    "key_hash" TEXT NOT NULL,
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ NOT NULL,
    "max_activations" INTEGER NOT NULL,
    "current_activations" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activation_codes" (
    "id" VARCHAR(26) NOT NULL,
    "code_hash" TEXT NOT NULL,
    "license_id" VARCHAR(26) NOT NULL,
    "redeemed_at" TIMESTAMPTZ,
    "redeemed_by_account_id" VARCHAR(26),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "activation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_sessions" (
    "id" VARCHAR(26) NOT NULL,
    "account_id" VARCHAR(26) NOT NULL,
    "state" "SessionState" NOT NULL DEFAULT 'IDLE',
    "started_at" TIMESTAMPTZ,
    "stopped_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "automation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" VARCHAR(26) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_discord_user_id_key" ON "accounts"("discord_user_id");
CREATE INDEX "accounts_status_idx" ON "accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_key_hash_key" ON "licenses"("key_hash");
CREATE INDEX "licenses_status_expires_at_idx" ON "licenses"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "activation_codes_code_hash_key" ON "activation_codes"("code_hash");
CREATE INDEX "activation_codes_license_id_idx" ON "activation_codes"("license_id");
CREATE INDEX "activation_codes_redeemed_at_idx" ON "activation_codes"("redeemed_at");

-- CreateIndex
CREATE UNIQUE INDEX "automation_sessions_account_id_key" ON "automation_sessions"("account_id");
CREATE INDEX "automation_sessions_state_idx" ON "automation_sessions"("state");

-- CreateIndex
CREATE INDEX "audit_logs_actor_created_at_idx" ON "audit_logs"("actor", "created_at");
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");
CREATE INDEX "audit_logs_correlation_id_idx" ON "audit_logs"("correlation_id");

-- AddForeignKey
ALTER TABLE "activation_codes" ADD CONSTRAINT "activation_codes_license_id_fkey"
    FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activation_codes" ADD CONSTRAINT "activation_codes_redeemed_by_account_id_fkey"
    FOREIGN KEY ("redeemed_by_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "automation_sessions" ADD CONSTRAINT "automation_sessions_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Audit append-only lockdown (ADR-0013).
-- Applied here so it survives `prisma migrate reset` cycles.
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dcrok_app') THEN
        REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "audit_logs" FROM "dcrok_app";
        GRANT SELECT, INSERT ON TABLE "audit_logs" TO "dcrok_app";
    END IF;

    IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dcrok_audit_read') THEN
        GRANT SELECT ON TABLE "audit_logs" TO "dcrok_audit_read";
    END IF;
END
$$;
