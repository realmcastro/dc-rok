import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '../lib/ipc';
import { IPC, type ActivationCodeRow } from '@shared/ipc-contract';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { formatDate } from '../lib/format';

export default function ActivationCodes() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [licenseId, setLicenseId] = useState('');
  const [lastPlain, setLastPlain] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['codes', filter],
    queryFn: () => invoke<ActivationCodeRow[]>(IPC.codesList, { redeemed: filter }),
  });

  const create = useMutation({
    mutationFn: (lid: string) =>
      invoke<ActivationCodeRow>(IPC.codesCreate, { licenseId: lid }),
    onSuccess: (row) => {
      setLastPlain(row.plaintext ?? null);
      void qc.invalidateQueries({ queryKey: ['codes'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Activation Codes</h1>
        <p className="text-sm text-fg-muted">Generate codes bound to a license.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate code</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (licenseId.trim()) create.mutate(licenseId.trim());
            }}
          >
            <label className="flex-1 text-xs text-fg-muted space-y-1">
              License ID
              <Input
                placeholder="01JX… (26 chars)"
                value={licenseId}
                onChange={(e) => setLicenseId(e.target.value.toUpperCase())}
              />
            </label>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Generating…' : 'Generate'}
            </Button>
          </form>
          {lastPlain && (
            <div className="mt-3 flex items-center gap-2 bg-bg-subtle border border-border-muted rounded px-3 py-2 font-mono text-sm">
              <span className="flex-1">{lastPlain}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void navigator.clipboard.writeText(lastPlain)}
              >
                Copy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Select value={filter} onChange={(e) => setFilter(e.target.value as 'ALL' | 'YES' | 'NO')} className="max-w-[180px]">
          <option value="ALL">All</option>
          <option value="NO">Not redeemed</option>
          <option value="YES">Redeemed</option>
        </Select>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>ID</TH>
            <TH>License</TH>
            <TH>State</TH>
            <TH>Created</TH>
            <TH>Redeemed at</TH>
            <TH>Redeemed by</TH>
          </TR>
        </THead>
        <TBody>
          {list.data?.map((row) => (
            <TR key={row.id}>
              <TD className="font-mono text-xs">{row.id}</TD>
              <TD className="font-mono text-xs">{row.licenseId}</TD>
              <TD>
                {row.redeemedAt ? (
                  <Badge tone="default">Redeemed</Badge>
                ) : (
                  <Badge tone="ok">Available</Badge>
                )}
              </TD>
              <TD>{formatDate(row.createdAt)}</TD>
              <TD>{formatDate(row.redeemedAt)}</TD>
              <TD className="font-mono text-xs">{row.redeemedByAccountId ?? '—'}</TD>
            </TR>
          ))}
          {list.data && list.data.length === 0 && (
            <TR>
              <TD colSpan={6} className="text-center text-fg-muted py-6">
                No codes.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
