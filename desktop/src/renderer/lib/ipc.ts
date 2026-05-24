import type { IpcApi, IpcChannel } from '@shared/ipc-contract';

const w = window as unknown as { dcrok?: IpcApi };

function missing(): IpcApi {
  const err = (channel: string): Promise<never> =>
    Promise.reject(
      new Error(
        `IPC bridge missing: window.dcrok is undefined. Preload script did not load (channel: ${channel}).`,
      ),
    );
  return {
    invoke: (channel) => err(channel) as Promise<never>,
    on: () => {
      console.warn('[ipc] window.dcrok missing — event listeners are no-ops');
      return () => undefined;
    },
  };
}

const api: IpcApi = w.dcrok ?? missing();

export function invoke<T = unknown>(channel: IpcChannel, payload?: unknown): Promise<T> {
  return api.invoke<T>(channel, payload);
}

export function on(channel: IpcChannel, listener: (data: unknown) => void): () => void {
  return api.on(channel, listener);
}
