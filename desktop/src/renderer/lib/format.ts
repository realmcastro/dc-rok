export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString();
}

export function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const s = Math.floor(abs / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const suffix = diff >= 0 ? 'ago' : 'from now';
  if (d > 0) return `${d}d ${suffix}`;
  if (h > 0) return `${h}h ${suffix}`;
  if (m > 0) return `${m}m ${suffix}`;
  return `${s}s ${suffix}`;
}
