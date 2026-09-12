'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

interface AdminPublication {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: string;
  productName: string;
  sellerName: string;
  sourceName: string;
  createdAt: string;
}

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'EXPIRED', 'DELETED'];
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  EXPIRED: 'bg-yellow-100 text-yellow-700',
  DELETED: 'bg-red-100 text-red-600',
};

export default function AdminPublicationsPage(): JSX.Element {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ title?: string; status?: string }>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-publications', page],
    queryFn: async () => {
      const res = await apiClient.get<{ items: AdminPublication[]; meta: { total: number; totalPages: number } }>(
        `/admin/publications?page=${page}&limit=20`,
        token ?? undefined,
      );
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: { title?: string; status?: string } }) => {
      await apiClient.patch(`/admin/publications/${id}`, body, token ?? undefined);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-publications'] });
      setEditId(null);
      setEditData({});
    },
  });

  function openEdit(pub: AdminPublication): void {
    setEditId(pub.id);
    setEditData({ title: pub.title, status: pub.status });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Publicaciones</h1>

      {isLoading ? (
        <TableSkeleton />
      ) : isError || !data ? (
        <ErrorMsg />
      ) : (
        <>
          <p className="text-sm text-gray-500">{data.meta.total} publicaciones en total</p>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Título', 'Precio', 'Estado', 'Producto', 'Fuente', 'Fecha', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((pub) => (
                  <tr key={pub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 max-w-xs truncate font-medium">{pub.title}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {pub.price.toLocaleString()} {pub.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[pub.status] ?? 'bg-gray-100'}`}>
                        {pub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{pub.productName}</td>
                    <td className="px-4 py-3 text-gray-500">{pub.sourceName}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(pub.createdAt).toLocaleDateString('es-CU')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(pub)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationRow page={page} totalPages={data.meta.totalPages} onPage={setPage} />
        </>
      )}

      {/* Edit modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold">Editar publicación</h3>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Título</label>
              <input
                type="text"
                value={editData.title ?? ''}
                onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Estado</label>
              <select
                value={editData.status ?? ''}
                onChange={(e) => setEditData((d) => ({ ...d, status: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setEditId(null); setEditData({}); }}
                className="flex-1 border rounded px-3 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => updateMutation.mutate({ id: editId, body: editData })}
                disabled={updateMutation.isPending}
                className="flex-1 bg-blue-600 text-white rounded px-3 py-2 text-sm disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaginationRow({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }): JSX.Element {
  if (totalPages <= 1) return <></>;
  return (
    <div className="flex justify-center gap-2 pt-2">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="px-3 py-1 text-sm border rounded disabled:opacity-40">← Anterior</button>
      <span className="text-sm text-gray-600 self-center">{page} / {totalPages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-40">Siguiente →</button>
    </div>
  );
}

function TableSkeleton(): JSX.Element {
  return (
    <div className="bg-white border rounded-lg overflow-hidden animate-pulse">
      <div className="h-10 bg-gray-100 border-b" />
      {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 border-b" />)}
    </div>
  );
}

function ErrorMsg(): JSX.Element {
  return <div className="text-center py-12 text-gray-400 text-sm">Error al cargar datos.</div>;
}
