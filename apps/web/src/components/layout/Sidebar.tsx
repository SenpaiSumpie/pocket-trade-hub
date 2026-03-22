'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Library,
  Store,
  ArrowLeftRight,
  BarChart3,
  List,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/hooks/useSocket';

const NAV_ITEMS = [
  { href: '/cards', label: 'Cards', icon: LayoutGrid },
  { href: '/collection', label: 'Collection', icon: Library },
  { href: '/market', label: 'Market', icon: Store },
  { href: '/proposals', label: 'Proposals', icon: ArrowLeftRight },
  { href: '/meta', label: 'Meta', icon: BarChart3 },
  { href: '/tierlists', label: 'Tier Lists', icon: List },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <aside className="flex w-16 flex-col border-r border-border bg-surface lg:w-60">
      {/* Logo */}
      <div className="flex h-16 items-center px-4">
        <span className="hidden text-lg font-bold text-gold lg:block">
          Pocket Trade Hub
        </span>
        <span className="text-lg font-bold text-gold lg:hidden">PTH</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--motion-duration-fast)] ${
                isActive
                  ? 'bg-gold/10 text-gold'
                  : 'text-text-muted hover:bg-surface-hover hover:text-text'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-gold' : 'text-text-muted'}
              />
              <span className="hidden lg:inline">{label}</span>
              {href === '/proposals' && unreadCount > 0 && (
                <span className="absolute right-2 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-error)] px-1 text-xs font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-border px-2 py-4">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          <LogOut size={20} />
          <span className="hidden lg:inline">Logout</span>
        </button>
      </div>
    </aside>
  );
}
