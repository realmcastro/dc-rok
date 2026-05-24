import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { invoke, on } from '../lib/ipc';
import {
  IPC,
  type BackendStatusEvent,
  type EnvSummary,
} from '@shared/ipc-contract';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Play, Square, RotateCcw } from 'lucide-react';

export default function Settings() {
  const [status, setStatus] = useState<BackendStatusEvent | null>(null);

  useEffect(() => {
    void invoke<BackendStatusEvent>(IPC.backendStatus).then(setStatus);
    return on(IPC.backendStatusEvent, (d) => setStatus(d as BackendStatusEvent));
  }, []);

  const env = useQuery({ queryKey: ['env'], queryFn: () => invoke<EnvSummary>(IPC.envSummary) });
  const db = useQuery({
    queryKey: ['db-health'],
    queryFn: () =>
      invoke<{ ok: boolean; latencyMs: number | null; error: string | null }>(IPC.dbHealth),
    refetchInterval: 10_000,
  });

  const start = useMutation({ mutationFn: () => invoke(IPC.backendStart) });
  const stop = useMutation({ mutationFn: () => invoke(IPC.backendStop) });
  const restart = useMutation({ mutationFn: () => invoke(IPC.backendRestart) });

  const running = status?.status === 'ONLINE' || status?.status === 'STARTING';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-fg-muted">Backend lifecycle, environment, health.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backend process</CardTitle>
          <CardDescription>
            Runs <code>npm run dev</code> in the dc-rok repo as a managed child process.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-fg-muted">Status</span>
            <Badge
              tone={
                status?.status === 'ONLINE'
                  ? 'ok'
                  : status?.status === 'CRASHED'
                    ? 'danger'
                    : 'default'
              }
            >
              {status?.status ?? '—'}
            </Badge>
            {status?.pid && <span className="text-xs text-fg-subtle">pid {status.pid}</span>}
            {status?.startedAt && (
              <span className="text-xs text-fg-subtle">
                started {new Date(status.startedAt).toLocaleString()}
              </span>
            )}
          </div>
          {status?.lastError && (
            <div className="text-xs text-danger font-mono">{status.lastError}</div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => start.mutate()} disabled={running}>
              <Play size={14} /> Start
            </Button>
            <Button variant="danger" onClick={() => stop.mutate()} disabled={!running}>
              <Square size={14} /> Stop
            </Button>
            <Button variant="secondary" onClick={() => restart.mutate()}>
              <RotateCcw size={14} /> Restart
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database</CardTitle>
          <CardDescription>PostgreSQL via Prisma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-fg-muted">Connection</span>
            <Badge tone={db.data?.ok ? 'ok' : 'danger'}>
              {db.data?.ok ? 'HEALTHY' : 'DOWN'}
            </Badge>
            {db.data?.latencyMs !== null && db.data?.latencyMs !== undefined && (
              <span className="text-xs text-fg-subtle">{db.data.latencyMs} ms</span>
            )}
          </div>
          {db.data?.error && (
            <div className="text-xs text-danger font-mono">{db.data.error}</div>
          )}
          <div className="text-xs text-fg-subtle">
            Host: <span className="font-mono">{env.data?.DATABASE_URL_host ?? '—'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>Loaded from project <code>.env</code> (secrets redacted).</CardDescription>
        </CardHeader>
        <CardContent>
          {env.data ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Field k="NODE_ENV" v={env.data.NODE_ENV} />
              <Field k="LOG_LEVEL" v={env.data.LOG_LEVEL} />
              <Field k="DATABASE_URL host" v={env.data.DATABASE_URL_host} />
              <Field k="DISCORD_APP_ID" v={env.data.DISCORD_APP_ID} />
              <Field k="DISCORD_DEV_GUILD_ID" v={env.data.DISCORD_DEV_GUILD_ID ?? '—'} />
              <Field k="Admin user IDs" v={String(env.data.ADMIN_DISCORD_USER_IDS_count)} />
              <Field
                k="LICENSE_HASH_PEPPER"
                v={env.data.LICENSE_HASH_PEPPER_present ? 'present (32+ chars)' : 'MISSING'}
              />
            </dl>
          ) : (
            <p className="text-sm text-fg-muted">Loading…</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-fg-muted">{k}</dt>
      <dd className="font-mono text-xs">{v}</dd>
    </>
  );
}
