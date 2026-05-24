import { useQuery } from '@tanstack/react-query';
import { invoke } from '../lib/ipc';
import { IPC, type SessionRow } from '@shared/ipc-contract';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { formatDate, formatRelative } from '../lib/format';

function toneFor(state: string): 'ok' | 'warn' | 'danger' | 'default' {
  if (state === 'ACTIVE') return 'ok';
  if (state === 'STOPPED') return 'warn';
  return 'default';
}

export default function Sessions() {
  const list = useQuery({
    queryKey: ['sessions'],
    queryFn: () => invoke<SessionRow[]>(IPC.sessionsList),
    refetchInterval: 3_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Sessions</h1>
        <p className="text-sm text-fg-muted">Automation session state per account.</p>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Session</TH>
            <TH>Account</TH>
            <TH>State</TH>
            <TH>Started</TH>
            <TH>Stopped</TH>
            <TH>Uptime</TH>
          </TR>
        </THead>
        <TBody>
          {list.data?.map((row) => (
            <TR key={row.id}>
              <TD className="font-mono text-xs">{row.id}</TD>
              <TD>{row.externalAccountName}</TD>
              <TD>
                <Badge tone={toneFor(row.state)}>{row.state}</Badge>
              </TD>
              <TD>{formatDate(row.startedAt)}</TD>
              <TD>{formatDate(row.stoppedAt)}</TD>
              <TD>{row.state === 'ACTIVE' && row.startedAt ? formatRelative(row.startedAt) : '—'}</TD>
            </TR>
          ))}
          {list.data && list.data.length === 0 && (
            <TR>
              <TD colSpan={6} className="text-center text-fg-muted py-6">
                No sessions.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>

      <p className="text-xs text-fg-subtle">
        Sessions are user-initiated via Discord (<code>/start</code>, <code>/stop</code>). Phase 2
        will add admin force-stop.
      </p>
    </div>
  );
}
