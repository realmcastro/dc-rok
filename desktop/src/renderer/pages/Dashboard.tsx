import { useQuery } from '@tanstack/react-query';
import { invoke } from '../lib/ipc';
import { IPC, type DashboardStats } from '@shared/ipc-contract';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Activity, Database, Bot, Users, KeyRound, Cpu } from 'lucide-react';

function Stat({
  label,
  value,
  tone,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  tone?: 'ok' | 'warn' | 'danger' | 'default';
  icon: typeof Activity;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-xs uppercase tracking-wide text-fg-muted">{label}</CardTitle>
        <Icon size={16} className="text-fg-subtle" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-semibold">{value}</div>
          {tone ? <Badge tone={tone}>{hint ?? ''}</Badge> : null}
        </div>
        {!tone && hint ? <div className="text-xs text-fg-subtle mt-1">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => invoke<DashboardStats>(IPC.dashboardStats),
    refetchInterval: 5_000,
  });

  if (isLoading || !data) {
    return <div className="text-fg-muted">Loading…</div>;
  }

  const backendTone = data.backend.status === 'ONLINE' ? 'ok' : data.backend.status === 'CRASHED' ? 'danger' : 'warn';
  const dbTone = data.dbHealth.ok ? 'ok' : 'danger';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-fg-muted">Operational overview at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat
          label="Bot status"
          value={data.backend.status}
          tone={backendTone}
          hint={data.backend.pid ? `pid ${data.backend.pid}` : 'no process'}
          icon={Bot}
        />
        <Stat
          label="Database"
          value={data.dbHealth.ok ? 'OK' : 'DOWN'}
          tone={dbTone}
          hint={data.dbHealth.latencyMs !== null ? `${data.dbHealth.latencyMs}ms` : data.dbHealth.error ?? ''}
          icon={Database}
        />
        <Stat
          label="Active sessions"
          value={data.activeSessions}
          icon={Activity}
          hint="running now"
        />
        <Stat
          label="Linked accounts"
          value={data.linkedAccounts}
          icon={Users}
          hint="status ACTIVE"
        />
        <Stat
          label="Expired licenses"
          value={data.expiredLicenses}
          tone={data.expiredLicenses > 0 ? 'warn' : 'default'}
          icon={KeyRound}
          hint={data.expiredLicenses > 0 ? 'review needed' : 'all good'}
        />
        <Stat label="Running automations" value={data.activeSessions} icon={Cpu} hint="phase 1: intent only" />
      </div>
    </div>
  );
}
