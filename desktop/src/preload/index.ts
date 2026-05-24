import { contextBridge, ipcRenderer } from 'electron';
import type { IpcApi, IpcChannel } from '@shared/ipc-contract';

const api: IpcApi = {
  invoke: (channel, payload) => ipcRenderer.invoke(channel, payload) as Promise<never>,
  on: (channel: IpcChannel, listener) => {
    const wrapped = (_event: unknown, data: unknown): void => listener(data);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  },
};

contextBridge.exposeInMainWorld('dcrok', api);

declare global {
  interface Window {
    dcrok: IpcApi;
  }
}
