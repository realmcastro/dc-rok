import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  KeyRound,
  Ticket,
  Users,
  Play,
  ScrollText,
  Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '../../lib/cn';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/licenses', label: 'Licenses', icon: KeyRound },
  { to: '/codes', label: 'Activation Codes', icon: Ticket },
  { to: '/accounts', label: 'Accounts', icon: Users },
  { to: '/sessions', label: 'Sessions', icon: Play },
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
] as const;

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-bg-subtle flex flex-col">
      <div className="px-4 py-4 border-b border-border-muted">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-accent/20 text-accent grid place-items-center text-xs font-bold">
            DC
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide">dc-rok</div>
            <div className="text-[10px] uppercase text-fg-subtle">admin panel</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-fg-muted hover:text-fg hover:bg-bg-card',
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 text-[10px] text-fg-subtle border-t border-border-muted">
        local • phase 1
      </div>
    </aside>
  );
}
