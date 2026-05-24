import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import type { BackendStatus, BackendStatusEvent, LogLine } from '@shared/ipc-contract';

/**
 * Spawns the dc-rok backend (../src/bootstrap/index.ts) via `npm run dev` in
 * the parent project. Captures stdout/stderr line-by-line, parses Pino JSON
 * when possible, and emits typed events for the IPC layer.
 *
 * Decoupled: the backend continues to be runnable standalone. This class only
 * controls a child process; it does not import backend code.
 */
export class BackendProcess extends EventEmitter {
  private child: ChildProcessWithoutNullStreams | null = null;
  private status: BackendStatus = 'OFFLINE';
  private startedAt: string | null = null;
  private lastExitCode: number | null = null;
  private lastError: string | null = null;

  private readonly cwd = path.resolve(__dirname, '../../..');

  getStatus(): BackendStatusEvent {
    return {
      status: this.status,
      pid: this.child?.pid ?? null,
      startedAt: this.startedAt,
      lastExitCode: this.lastExitCode,
      lastError: this.lastError,
    };
  }

  start(): void {
    if (this.child) return;
    this.setStatus('STARTING');
    this.lastError = null;
    this.lastExitCode = null;

    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'npm.cmd' : 'npm';
    const child = spawn(cmd, ['run', 'dev'], {
      cwd: this.cwd,
      env: { ...process.env, FORCE_COLOR: '0' },
      shell: isWin,
    });

    this.child = child;
    this.startedAt = new Date().toISOString();

    this.pipe(child.stdout, 'stdout');
    this.pipe(child.stderr, 'stderr');

    child.on('spawn', () => this.setStatus('ONLINE'));
    child.on('exit', (code, signal) => {
      this.child = null;
      this.lastExitCode = code;
      if (signal === 'SIGTERM' || signal === 'SIGINT' || this.status === 'STOPPING') {
        this.setStatus('OFFLINE');
      } else {
        this.lastError = `exited with code ${code ?? 'null'} signal ${signal ?? 'null'}`;
        this.setStatus('CRASHED');
      }
    });
    child.on('error', (err) => {
      this.lastError = err.message;
      this.setStatus('CRASHED');
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.child) {
        resolve();
        return;
      }
      this.setStatus('STOPPING');
      const child = this.child;
      const done = (): void => resolve();
      child.once('exit', done);
      child.kill('SIGINT');
      setTimeout(() => {
        if (this.child) this.child.kill('SIGKILL');
      }, 5000);
    });
  }

  async restart(): Promise<void> {
    await this.stop();
    this.start();
  }

  private setStatus(status: BackendStatus): void {
    this.status = status;
    this.emit('status', this.getStatus());
  }

  private pipe(stream: NodeJS.ReadableStream, kind: 'stdout' | 'stderr'): void {
    let buffer = '';
    stream.setEncoding('utf8');
    stream.on('data', (chunk: string) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const raw of lines) {
        if (raw.length === 0) continue;
        this.emit('log', this.toLogLine(raw, kind));
      }
    });
  }

  private toLogLine(raw: string, stream: 'stdout' | 'stderr'): LogLine {
    const ts = new Date().toISOString();
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const level =
        typeof parsed['level'] === 'number'
          ? this.pinoLevelName(parsed['level'])
          : typeof parsed['level'] === 'string'
            ? (parsed['level'] as string)
            : undefined;
      return { ts, stream, raw, parsed, ...(level ? { level } : {}) };
    } catch {
      return { ts, stream, raw, level: stream === 'stderr' ? 'error' : 'info' };
    }
  }

  private pinoLevelName(level: number): string {
    if (level >= 60) return 'fatal';
    if (level >= 50) return 'error';
    if (level >= 40) return 'warn';
    if (level >= 30) return 'info';
    if (level >= 20) return 'debug';
    return 'trace';
  }
}
