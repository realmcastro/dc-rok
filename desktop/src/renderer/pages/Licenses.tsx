import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '../lib/ipc';
import { IPC, type ActivationCodeRow, type LicenseRow } from '@shared/ipc-contract';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { formatDate } from '../lib/format';
import { Plus } from 'lucide-react';

function toneFor(status: string): 'ok' | 'warn' | 'danger' | 'default' {
  if (status === 'ACTIVE') return 'ok';
  if (status === 'EXPIRED') return 'warn';
  if (status === 'REVOKED') return 'danger';
  return 'default';
}

export default function Licenses() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createdCodes, setCreatedCodes] = useState<ActivationCodeRow[]>([]);

  const list = useQuery({
    queryKey: ['licenses', statusFilter, search],
    queryFn: () =>
      invoke<LicenseRow[]>(IPC.licensesList, { status: statusFilter, search }),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => invoke<void>(IPC.licensesRevoke, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['licenses'] }),
  });

  const create = useMutation({
    mutationFn: (input: { expiresAt: string; maxActivations: number; initialCodes: number }) =>
      invoke<{ license: LicenseRow; codes: ActivationCodeRow[] }>(IPC.licensesCreate, {
        ...input,
        createdBy: 'admin-ui',
      }),
    onSuccess: (data) => {
      setCreatedCodes(data.codes);
      void qc.invalidateQueries({ queryKey: ['licenses'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Licenses</h1>
          <p className="text-sm text-fg-muted">Issue, browse and revoke licenses.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus size={14} /> New license
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Issue license</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateLicenseForm onSubmit={(v) => create.mutate(v)} loading={create.isPending} />
            {createdCodes.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-fg-muted mb-2">
                  Activation codes (shown once — copy now):
                </div>
                <div className="space-y-1 font-mono text-sm">
                  {createdCodes.map((c) => (
                    <CodeReveal key={c.id} code={c.plaintext ?? ''} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder="search id…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="REVOKED">Revoked</option>
        </Select>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>ID</TH>
            <TH>Status</TH>
            <TH>Expires</TH>
            <TH>Activations</TH>
            <TH>Created</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {list.data?.map((row) => (
            <TR key={row.id}>
              <TD className="font-mono text-xs">{row.id}</TD>
              <TD>
                <Badge tone={toneFor(row.status)}>{row.status}</Badge>
              </TD>
              <TD>{formatDate(row.expiresAt)}</TD>
              <TD>
                {row.currentActivations}/{row.maxActivations}
              </TD>
              <TD>{formatDate(row.createdAt)}</TD>
              <TD className="text-right">
                <Button
                  variant="danger"
                  size="sm"
                  disabled={row.status === 'REVOKED'}
                  onClick={() => revoke.mutate(row.id)}
                >
                  Revoke
                </Button>
              </TD>
            </TR>
          ))}
          {list.data && list.data.length === 0 && (
            <TR>
              <TD colSpan={6} className="text-center text-fg-muted py-6">
                No licenses.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}

function CreateLicenseForm({
  onSubmit,
  loading,
}: {
  onSubmit: (v: { expiresAt: string; maxActivations: number; initialCodes: number }) => void;
  loading: boolean;
}) {
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [maxActivations, setMaxActivations] = useState(5);
  const [initialCodes, setInitialCodes] = useState(1);

  return (
    <form
      className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          expiresAt: new Date(`${expiresAt}T23:59:59Z`).toISOString(),
          maxActivations,
          initialCodes,
        });
      }}
    >
      <label className="text-xs text-fg-muted space-y-1">
        Expires
        <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      </label>
      <label className="text-xs text-fg-muted space-y-1">
        Max activations
        <Input
          type="number"
          min={1}
          value={maxActivations}
          onChange={(e) => setMaxActivations(Number(e.target.value))}
        />
      </label>
      <label className="text-xs text-fg-muted space-y-1">
        Initial codes
        <Input
          type="number"
          min={0}
          value={initialCodes}
          onChange={(e) => setInitialCodes(Number(e.target.value))}
        />
      </label>
      <Button type="submit" disabled={loading}>
        {loading ? 'Issuing…' : 'Issue'}
      </Button>
    </form>
  );
}

function CodeReveal({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 bg-bg-subtle border border-border-muted rounded px-3 py-1.5">
      <span>{code}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          void navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}
