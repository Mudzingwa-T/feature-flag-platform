'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui';

const nav = [
  { href: '/', label: 'Flags' },
  { href: '/playground', label: 'Playground' },
  { href: '/audit', label: 'Audit' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="hidden border-r border-line bg-surface lg:flex lg:flex-col">
        <div className="flex items-center gap-2 px-5 py-4">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-white mono text-xs font-bold">FF</span>
          <span className="text-sm font-semibold tracking-tight">Control Plane</span>
        </div>
        <nav className="flex-1 px-3 py-2">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-1 block rounded-lg px-3 py-2 text-sm ${
                  active ? 'bg-paper font-medium text-ink' : 'text-muted hover:bg-paper hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-4 py-3">
          <p className="truncate text-xs text-muted">{user.email}</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="mono text-[11px] tracking-wide text-off">{user.role}</span>
            <button className="text-xs text-muted hover:text-danger" onClick={() => { logout(); router.replace('/login'); }}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-3 lg:hidden">
          <span className="text-sm font-semibold">Control Plane</span>
          <button className="text-xs text-muted" onClick={() => { logout(); router.replace('/login'); }}>Sign out</button>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">{children}</main>
      </div>
    </div>
  );
}
