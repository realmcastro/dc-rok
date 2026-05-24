import { useEffect, useMemo, useRef, useState } from 'react';
import { on } from '../lib/ipc';
import { IPC, type LogLine } from '@shared/ipc-contract';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const MAX_LINES = 2000;

const levelTone = (level?: string): 'ok' | 'warn' | 'danger' | 'default' => {
  if (level === 'error' || level === 'fatal') return 'danger';
  if (level === 'warn') return 'warn';
  if (level === 'info') return 'ok';
  return 'default';
};

export default function Logs() {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [level, setLevel] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [follow, setFollow] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const off = on(IPC.backendLogEvent, (data) => {
      const l = data as LogLine;
      setLines((prev) => {
        const next = [...prev, l];
        return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
      });
    });
    return off;
  }, []);

  useEffect(() => {
    if (follow && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, follow]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return lines.filter((l) => {
      if (level !== 'ALL' && l.level !== level) return false;
      if (needle && !l.raw.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [lines, level, search]);

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div>
        <h1 className="text-xl font-semibold">Logs</h1>
        <p className="text-sm text-fg-muted">Live stdout/stderr from the backend process.</p>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={level} onChange={(e) => setLevel(e.target.value)} className="max-w-[140px]">
          <option value="ALL">All levels</option>
          <option value="trace">trace</option>
          <option value="debug">debug</option>
          <option value="info">info</option>
          <option value="warn">warn</option>
          <option value="error">error</option>
          <option value="fatal">fatal</option>
        </Select>
        <Button variant="secondary" size="sm" onClick={() => setFollow((v) => !v)}>
          {follow ? 'Follow: ON' : 'Follow: OFF'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setLines([])}>
          Clear
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            void navigator.clipboard.writeText(filtered.map((l) => l.raw).join('\n'))
          }
        >
          Copy
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-auto rounded-md border border-border-muted bg-bg-subtle font-mono text-xs"
      >
        {filtered.map((l, i) => (
          <div key={i} className="px-3 py-1 border-b border-border-muted/30 flex gap-3">
            <span className="text-fg-subtle shrink-0">{l.ts.slice(11, 19)}</span>
            <Badge tone={levelTone(l.level)} className="shrink-0">
              {l.level ?? l.stream}
            </Badge>
            <span className="whitespace-pre-wrap break-all">{l.raw}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-6 text-center text-fg-muted">
            No logs yet — start the backend from Settings.
          </div>
        )}
      </div>
    </div>
  );
}
