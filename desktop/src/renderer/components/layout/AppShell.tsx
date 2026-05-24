import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BackendStatusBar } from './BackendStatusBar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <BackendStatusBar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
