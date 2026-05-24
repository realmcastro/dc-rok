/**
 * Single source of truth for IPC channel names and payload shapes.
 * Imported by main, preload, and renderer.
 */

export type BackendStatus = 'OFFLINE' | 'STARTING' | 'ONLINE' | 'CRASHED' | 'STOPPING';

export interface BackendStatusEvent {
  status: BackendStatus;
  pid: number | null;
  startedAt: string | null;
  lastExitCode: number | null;
  lastError: string | null;
}

export interface LogLine {
  ts: string;
  stream: 'stdout' | 'stderr';
  level?: string;
  raw: string;
  parsed?: Record<string, unknown>;
}

export interface DashboardStats {
  backend: BackendStatusEvent;
  dbHealth: { ok: boolean; latencyMs: number | null; error: string | null };
  activeSessions: number;
  expiredLicenses: number;
  linkedAccounts: number;
}

export interface LicenseRow {
  id: string;
  status: string;
  expiresAt: string;
  maxActivations: number;
  currentActivations: number;
  createdBy: string;
  createdAt: string;
}

export interface ActivationCodeRow {
  id: string;
  licenseId: string;
  redeemedAt: string | null;
  redeemedByAccountId: string | null;
  createdAt: string;
  // Plaintext is shown ONLY at creation time, never re-fetched.
  plaintext?: string;
}

export interface AccountRow {
  id: string;
  externalAccountName: string;
  discordUserId: string | null;
  status: string;
  createdAt: string;
}

export interface SessionRow {
  id: string;
  accountId: string;
  externalAccountName: string;
  state: string;
  startedAt: string | null;
  stoppedAt: string | null;
}

export interface EnvSummary {
  NODE_ENV: string;
  LOG_LEVEL: string;
  DATABASE_URL_host: string;
  DISCORD_APP_ID: string;
  DISCORD_DEV_GUILD_ID: string | null;
  ADMIN_DISCORD_USER_IDS_count: number;
  LICENSE_HASH_PEPPER_present: boolean;
}

// ---- Channels ----

export const IPC = {
  // backend lifecycle
  backendStart: 'backend:start',
  backendStop: 'backend:stop',
  backendRestart: 'backend:restart',
  backendStatus: 'backend:status',
  backendStatusEvent: 'backend:status:event',
  backendLogEvent: 'backend:log:event',

  // dashboard
  dashboardStats: 'dashboard:stats',

  // licenses
  licensesList: 'licenses:list',
  licensesCreate: 'licenses:create',
  licensesRevoke: 'licenses:revoke',

  // activation codes
  codesList: 'codes:list',
  codesCreate: 'codes:create',

  // accounts
  accountsList: 'accounts:list',
  accountsReset: 'accounts:reset',

  // sessions
  sessionsList: 'sessions:list',

  // settings
  envSummary: 'env:summary',
  dbHealth: 'db:health',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

export interface IpcApi {
  invoke<T = unknown>(channel: IpcChannel, payload?: unknown): Promise<T>;
  on(channel: IpcChannel, listener: (data: unknown) => void): () => void;
}
