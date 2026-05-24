import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { BackendProcess } from './backend-process.js';
import { AdminService } from './admin-service.js';
import { IPC } from '@shared/ipc-contract';

function loadDotEnv(): void {
  const envPath = path.resolve(__dirname, '../../../.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!m) continue;
    const [, key, value] = m;
    if (key && !(key in process.env)) {
      process.env[key] = value ?? '';
    }
  }
}

loadDotEnv();

const isDev = !app.isPackaged;
const RENDERER_DEV_URL = 'http://localhost:5180';

let mainWindow: BrowserWindow | null = null;

const prisma = new PrismaClient({ datasourceUrl: process.env['DATABASE_URL'] });
const admin = new AdminService(prisma, process.env['LICENSE_HASH_PEPPER'] ?? '');
const backend = new BackendProcess();

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0b0d10',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    void mainWindow.loadURL(RENDERER_DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

function broadcast(channel: string, payload: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

backend.on('status', (s) => broadcast(IPC.backendStatusEvent, s));
backend.on('log', (l) => broadcast(IPC.backendLogEvent, l));

function registerIpc(): void {
  ipcMain.handle(IPC.backendStart, () => {
    backend.start();
    return backend.getStatus();
  });
  ipcMain.handle(IPC.backendStop, async () => {
    await backend.stop();
    return backend.getStatus();
  });
  ipcMain.handle(IPC.backendRestart, async () => {
    await backend.restart();
    return backend.getStatus();
  });
  ipcMain.handle(IPC.backendStatus, () => backend.getStatus());

  ipcMain.handle(IPC.dashboardStats, () => admin.dashboard(backend.getStatus()));
  ipcMain.handle(IPC.dbHealth, () => admin.dbHealth());
  ipcMain.handle(IPC.envSummary, () => admin.envSummary());

  ipcMain.handle(IPC.licensesList, (_e, payload) =>
    admin.listLicenses(payload as { status?: string; search?: string }),
  );
  ipcMain.handle(IPC.licensesCreate, (_e, payload) =>
    admin.createLicense(
      payload as {
        expiresAt: string;
        maxActivations: number;
        createdBy: string;
        initialCodes: number;
      },
    ),
  );
  ipcMain.handle(IPC.licensesRevoke, (_e, payload) =>
    admin.revokeLicense((payload as { id: string }).id),
  );

  ipcMain.handle(IPC.codesList, (_e, payload) =>
    admin.listCodes(payload as { redeemed?: 'ALL' | 'YES' | 'NO' }),
  );
  ipcMain.handle(IPC.codesCreate, (_e, payload) =>
    admin.createCode((payload as { licenseId: string }).licenseId),
  );

  ipcMain.handle(IPC.accountsList, () => admin.listAccounts());
  ipcMain.handle(IPC.accountsReset, (_e, payload) =>
    admin.resetAccount((payload as { accountId: string }).accountId),
  );

  ipcMain.handle(IPC.sessionsList, () => admin.listSessions());
}

void app.whenReady().then(async () => {
  registerIpc();
  await prisma.$connect().catch(() => undefined);
  createWindow();
  if (process.env['DCROK_AUTO_START'] === '1') {
    backend.start();
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  await backend.stop().catch(() => undefined);
  await prisma.$disconnect().catch(() => undefined);
});
