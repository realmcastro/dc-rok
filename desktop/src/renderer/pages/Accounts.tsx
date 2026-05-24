import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '../lib/ipc';
import { IPC, type AccountRow } from '@shared/ipc-contract';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatDate } from '../lib/format';

function toneFor(status: string): 'ok' | 'warn' | 'danger' | 'default' {
  if (status === 'ACTIVE') return 'ok';
  if (status === 'SUSPENDED') return 'danger';
  return 'default';
}

export default function Accounts() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['accounts'],
    queryFn: () => invoke<AccountRow[]>(IPC.accountsList),
  });
  const reset = useMutation({
    mutationFn: (accountId: string) => invoke<void>(IPC.accountsReset, { accountId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Accounts</h1>
        <p className="text-sm text-fg-muted">Linked Discord users.</p>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Account ID</TH>
            <TH>External name</TH>
            <TH>Discord user</TH>
            <TH>Status</TH>
            <TH>Created</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {list.data?.map((row) => (
            <TR key={row.id}>
              <TD className="font-mono text-xs">{row.id}</TD>
              <TD>{row.externalAccountName}</TD>
              <TD className="font-mono text-xs">{row.discordUserId ?? '—'}</TD>
              <TD>
                <Badge tone={toneFor(row.status)}>{row.status}</Badge>
              </TD>
              <TD>{formatDate(row.createdAt)}</TD>
              <TD className="text-right">
                <Button
                  variant="danger"
                  size="sm"
                  disabled={row.status !== 'ACTIVE'}
                  onClick={() => {
                    if (confirm(`Reset account ${row.externalAccountName}?`)) {
                      reset.mutate(row.id);
                    }
                  }}
                >
                  Reset
                </Button>
              </TD>
            </TR>
          ))}
          {list.data && list.data.length === 0 && (
            <TR>
              <TD colSpan={6} className="text-center text-fg-muted py-6">
                No accounts.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
