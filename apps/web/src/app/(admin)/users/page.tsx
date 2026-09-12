'use client';

import React from 'react';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

export default function AdminUsersPage(): React.React.JSX.Element {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: async () => {
      const res = await apiClient.get<{ items: AdminUser[]; meta: { total: number; totalPages: number } }>(
        `/admin/users?page=${page}&limit=20`,
        token ?? undefined,
      );
      return res.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) => {
      await apiClient.patch(`/admin/users/${id}/status`, { status }, token ?? undefined);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Gestión de usuarios</h1>

      {isLoading ? (
        <TableSkeleton cols={6} />
      ) : isError || !data ? (
        <ErrorMsg />
      ) : (
        <>
          <p className="text-sm text-gray-500">{data.meta.total} usuarios registrados</p>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Nombre', 'Correo', 'Rol', 'Estado', 'Registro', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{user.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{user.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[user.status] ?? 'bg-gray-100'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('es-CU')}
                    </td>
                    <td className="px-4 py-3">
                      {user.status === 'ACTIVE' ? (
                        <button
                          onClick={() => statusMutation.mutate({ id: user.id, status: 'SUSPENDED' })}
                          disabled={statusMutation.isPending}
                          className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Suspender
                        </button>
                      ) : user.status === 'SUSPENDED' ? (
                        <button
                          onClick={() => statusMutation.mutate({ id: user.id, status: 'ACTIVE' })}
                          disabled={statusMutation.isPending}
                          className="text-xs text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          Activar
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationRow page={page} totalPages={data.meta.totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function PaginationRow({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }): React.React.JSX.Element {
  if (totalPages <= 1) return <></>;
  return (
    <div className="flex justify-center gap-2 pt-2">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="px-3 py-1 text-sm border rounded disabled:opacity-40">← Anterior</button>
      <span className="text-sm text-gray-600 self-center">{page} / {totalPages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-40">Siguiente →</button>
    </div>
  );
}

function TableSkeleton({ cols }: { cols: number }): React.React.JSX.Element {
  return (
    <div className="bg-white border rounded-lg overflow-hidden animate-pulse">
      <div className="h-10 bg-gray-100 border-b" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 border-b bg-white flex gap-4 px-4 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-100 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ErrorMsg(): React.React.JSX.Element {
  return <div className="text-center py-12 text-gray-400 text-sm">Error al cargar datos.</div>;
}
