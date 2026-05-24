import { useEffect, useState } from 'react';
import { invoke, on } from '../../lib/ipc';
import { IPC, type BackendStatus, type BackendStatusEvent } from '@shared/ipc-contract';
import { Badge } from '../ui/Badge';

type Tone = 'default' | 'ok' | 'warn' | 'danger' | 'info';

const tones: Record<BackendStatus, Tone> = {
  ONLINE: 'ok',
  STARTING: 'info',
  STOPPING: 'warn',
  CRASHED: 'danger',
  OFFLINE: 'default',
};

export function BackendStatusBar() {
  const [status, setStatus] = useState<BackendStatusEvent | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  useEffect(() => {
    invoke<BackendStatusEvent>(IPC.backendStatus)
      .then(setStatus)
      .catch((e: unknown) => setBridgeError(e instanceof Error ? e.message : String(e)));
    return on(IPC.backendStatusEvent, (data) => setStatus(data as BackendStatusEvent));
  }, []);

  if (bridgeError) {
    return (
      <header className="h-12 border-b border-border bg-bg-subtle px-6 flex items-center gap-3 text-xs">
        <Badge tone="danger">IPC ERROR</Badge>
        <span className="text-danger font-mono truncate">{bridgeError}</span>
      </header>
    );
  }

  return (
    <header className="h-12 border-b border-border bg-bg-subtle px-6 flex items-center justify-between text-xs">
      <div className="flex items-center gap-3">
        <span className="text-fg-muted">backend</span>
        <Badge tone={status ? tones[status.status] : 'default'}>{status?.status ?? '—'}</Badge>
        {status?.pid && <span className="text-fg-subtle">pid {status.pid}</span>}
      </div>
      <div className="text-fg-subtle">
        {status?.lastError ? <span className="text-danger">{status.lastError}</span> : null}
      </div>
    </header>
  );
}
