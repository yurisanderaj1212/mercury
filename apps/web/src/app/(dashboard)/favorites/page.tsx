'use client';

import React from 'react';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { useFavoritesStore } from '@/stores/favorites.store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface FavoriteItem {
  id: string;
  publicationId: string;
  createdAt: string;
  publication?: {
    id: string;
    title: string;
    price: number;
    currency: string;
    status: string;
    productName?: string;
    sellerName?: string;
    municipality?: string;
  };
}

export default function FavoritesPage(): React.JSX.Element {
  const token = useAuthStore((s) => s.token);
  const { removeFavorite } = useFavoritesStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['favorites', page],
    queryFn: async () => {
      const res = await apiClient.get<{ items: FavoriteItem[]; total: number; totalPages: number }>(
        `/favorites?page=${page}&limit=20`,
        token ?? undefined,
      );
      return res.data;
    },
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: async (favId: string) => {
      await apiClient.delete(`/favorites/${favId}`, token ?? undefined);
    },
    onSuccess: (_data, favId) => {
      const item = data?.items.find((f) => f.id === favId);
      if (item) removeFavorite(item.publicationId);
      void queryClient.invalidateQueries({ queryKey: ['favorites'] });
      setConfirmDelete(null);
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Favoritos</h1>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded" />)}
        </div>
      ) : isError || !data ? (
        <div className="text-center py-12 text-gray-400 text-sm">Error al cargar favoritos.</div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">♡</p>
          <p className="text-sm">Aún no tienes favoritos.</p>
          <Link href="/search" className="text-blue-600 text-sm mt-2 block">Explorar publicaciones →</Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{data.total} publicaciones guardadas</p>
          <div className="space-y-2">
            {data.items.map((fav) => (
              <div key={fav.id} className="border rounded-lg p-4 flex items-center gap-3 bg-white">
                <Link href={`/publications/${fav.publicationId}`} className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {fav.publication?.title ?? fav.publicationId}
                  </p>
                  {fav.publication && (
                    <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                      <span className="font-semibold text-gray-800">
                        {fav.publication.price.toLocaleString()} {fav.publication.currency}
                      </span>
                      {fav.publication.productName && <span>{fav.publication.productName}</span>}
                      {fav.publication.municipality && <span>{fav.publication.municipality}</span>}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Guardado el {new Date(fav.createdAt).toLocaleDateString('es-CU')}
                  </p>
                </Link>

                {/* Status badge */}
                {fav.publication?.status && fav.publication.status !== 'ACTIVE' && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                    {fav.publication.status}
                  </span>
                )}

                {/* Delete */}
                {confirmDelete === fav.id ? (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => deleteMutation.mutate(fav.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs border px-2 py-1 rounded"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(fav.id)}
                    className="text-gray-400 hover:text-red-500 text-sm shrink-0"
                    title="Eliminar de favoritos"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className="px-3 py-1 text-sm border rounded disabled:opacity-40">
                ← Anterior
              </button>
              <span className="text-sm text-gray-600 self-center">{page} / {data.totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-40">
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
