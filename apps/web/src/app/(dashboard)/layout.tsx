'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/search', label: 'Buscar' },
  { href: '/products', label: 'Productos' },
  { href: '/alerts', label: 'Alertas' },
  { href: '/favorites', label: 'Favoritos' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, clearAuth } = useAuthStore();

  async function handleLogout(): Promise<void> {
    if (token) {
      try { await apiClient.post('/auth/logout', {}, token); } catch { /* ignore */ }
    }
    clearAuth();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b h-14 flex items-center px-4 gap-4">
        <Link href="/" className="font-bold text-blue-600 text-lg mr-4">Mercury</Link>
        <div className="flex-1">
          <Link href="/search">
            <input
              readOnly
              placeholder="🔍 Buscar producto..."
              className="w-full max-w-md border rounded px-3 py-1.5 text-sm cursor-pointer"
            />
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">{user?.fullName}</span>
          <button
            onClick={() => { void handleLogout(); }}
            className="text-gray-500 hover:text-red-500"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="flex pt-14 flex-1">
        {/* Sidebar */}
        <aside className="w-48 fixed left-0 top-14 bottom-0 border-r bg-white pt-4 hidden md:block">
          <nav className="px-2 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin/users"
                className="block px-3 py-2 rounded text-sm font-medium text-purple-700 hover:bg-purple-50 mt-2 border-t pt-3"
              >
                Panel Admin
              </Link>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-48 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
