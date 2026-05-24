# dc-rok Desktop Admin

Local Electron + React + Vite admin panel for the dc-rok project.

## Architecture

```
desktop/
├─ electron.vite.config.ts        electron-vite (main / preload / renderer)
├─ tailwind.config.ts             dark theme tokens
├─ src/
│  ├─ main/                       Electron main process
│  │  ├─ index.ts                 entry, window, IPC wiring, .env loader
│  │  ├─ backend-process.ts       spawn/stop/restart dc-rok bot (child process)
│  │  └─ admin-service.ts         Prisma queries + license issuance (HMAC matches bot)
│  ├─ preload/
│  │  └─ index.ts                 contextBridge exposing `window.dcrok` (typed)
│  ├─ shared/
│  │  └─ ipc-contract.ts          single source of truth for IPC channels + types
│  └─ renderer/                   React 18 + react-router + react-query
│     ├─ components/
│     │  ├─ layout/               Sidebar, AppShell, BackendStatusBar
│     │  └─ ui/                   Button, Card, Table, Badge, Input (shadcn-style primitives)
│     ├─ pages/                   Dashboard, Licenses, ActivationCodes, Accounts, Sessions, Logs, Settings
│     └─ lib/                     ipc, cn, format helpers
```

### Design decisions

- **Reuse, don't duplicate.** The Electron main process talks to the same Postgres + Prisma schema as the bot. Admin-only operations (issue/revoke license, generate codes, reset account) are written directly via Prisma in `admin-service.ts`. User-initiated flows (`/init`, `/start`, `/stop`, `/reset`) remain owned by the bot — the admin panel never duplicates that path.
- **HMAC pepper parity.** License/activation-code hashes use the same `LICENSE_HASH_PEPPER` and HMAC-SHA256 scheme as `src/license/infrastructure/hmac-license-hasher.ts`. Codes issued from the panel are immediately redeemable by the bot.
- **Bot lifecycle as a child process.** `BackendProcess` spawns `npm run dev` in the parent dc-rok repo, captures stdout/stderr line-by-line, parses Pino JSON, and emits typed events to the renderer over IPC. The bot stays runnable standalone — the panel is just a controller.
- **Secure IPC.** `contextIsolation: true`, `nodeIntegration: false`, sandboxed preload exposing a typed `window.dcrok` surface. Renderer cannot touch Node, the filesystem, or Prisma directly — every operation goes through a channel listed in `ipc-contract.ts`.
- **Layering inside Electron.** UI (renderer) → IPC contract (shared) → orchestration (main IPC handlers) → services (admin-service + backend-process) → Prisma / child process. No Prisma types leak to the renderer; everything is plain DTOs.
- **No clouds.** Local-only. No telemetry, no remote API.

## Prerequisites

- Node 22 LTS (matches the parent project's `.nvmrc`).
- The parent dc-rok project's `.env` filled in (this app reads it from `../.env`).
- Docker Postgres running (`docker compose up -d` in the parent repo).
- `npm install` already run in the parent repo (the bot child process needs its `node_modules`).

## Install

```bash
cd desktop
npm install
```

## Run (dev)

```bash
npm run dev
```

Launches Electron + Vite dev server with HMR for the renderer.

## Build

```bash
npm run build       # bundles main / preload / renderer to ./out
npm run dist        # produces a Windows installer via electron-builder
```

## Pages

| Page              | Purpose                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| Dashboard         | Cards: bot status, DB health, active sessions, expired licenses, etc.  |
| Licenses          | Issue, list, filter (status/search), revoke. Initial codes shown once. |
| Activation Codes  | Generate codes bound to a license. Filter redeemed/available. Copy.    |
| Accounts          | List linked accounts. Reset (unlink) an account.                       |
| Sessions          | Live view of `ACTIVE` / `STOPPED` automation sessions.                 |
| Logs              | Live stream of bot stdout/stderr. Filter by level + search. Copy.      |
| Settings          | Backend start/stop/restart, DB health, env summary (no secrets).       |

## Conventions

- One file per UI primitive / page; co-locate small helpers.
- IPC channel names live ONLY in `ipc-contract.ts`. Adding a feature = add a channel + handler + hook.
- No business logic in renderer — only data fetching, presentation, user input.
- No `process.env` reads in renderer or pages. The env summary is a DTO from main.
- No Prisma imports in the renderer. Ever.
