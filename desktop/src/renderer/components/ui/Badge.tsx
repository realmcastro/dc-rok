import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'default' | 'ok' | 'warn' | 'danger' | 'info';

const tones: Record<Tone, string> = {
  default: 'bg-bg-subtle text-fg-muted border-border',
  ok: 'bg-ok/10 text-ok border-ok/30',
  warn: 'bg-warn/10 text-warn border-warn/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  info: 'bg-accent/10 text-accent border-accent/30',
};

export function Badge({
  tone = 'default',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
