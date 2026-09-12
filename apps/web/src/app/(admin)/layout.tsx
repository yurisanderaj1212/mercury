'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect } from 'react';

const ADMIN_LINKS = [
  { href: '/admin/users', label: 'Usuarios' },
  { href: '/admin/publications', label: 'Publicaciones' },
  { href: '/admin/categories', label: 'Categorías' },
  { href: '/admin/logs', label: 'Auditoría' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }): React.React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [token, user, router]);

  if (!token || user?.role !== 'ADMIN') return <></>;

  function handleLogout(): void {
    clearAuth();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white h-14 flex items-center px-4 gap-4">
        <Link href="/admin/users" className="font-bold text-lg mr-4">Mercury Admin</Link>
        <div className="flex-1" />
        <span className="text-sm text-gray-300">{user?.email}</span>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white ml-3">
          Salir
        </button>
      </header>

      <div className="flex pt-14 flex-1">
        <aside className="w-48 fixed left-0 top-14 bottom-0 bg-gray-800 pt-4 hidden md:block">
          <nav className="px-2 space-y-1">
            {ADMIN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 px-4">
            <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-300">
              ← Volver al dashboard
            </Link>
          </div>
        </aside>

        <main className="flex-1 md:ml-48 p-6 bg-gray-50 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
