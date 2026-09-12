'use client';

import React from 'react';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description?: string;
  slug: string;
  categoryId: string;
  categoryName?: string;
  brandName?: string;
  status: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage(): React.React.JSX.Element {
  const token = useAuthStore((s) => s.token);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<Category[]>('/categories', token ?? undefined);
      return res.data ?? [];
    },
  });

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (categoryFilter) params.set('category', categoryFilter);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', categoryFilter, page],
    queryFn: async () => {
      const res = await apiClient.get<{ items: Product[]; total: number; totalPages: number }>(
        `/products?${params.toString()}`,
        token ?? undefined,
      );
      return res.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Productos</h1>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <GridSkeleton />
      ) : isError || !data ? (
        <div className="text-center py-12 text-gray-400 text-sm">Error al cargar productos.</div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No hay productos en esta categoría.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="border rounded-lg p-4 hover:shadow-sm transition-shadow bg-white block"
              >
                <p className="font-medium text-sm">{product.name}</p>
                {product.categoryName && (
                  <p className="text-xs text-blue-600 mt-1">{product.categoryName}</p>
                )}
                {product.brandName && (
                  <p className="text-xs text-gray-400 mt-0.5">{product.brandName}</p>
                )}
                {product.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{product.description}</p>
                )}
              </Link>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-600 self-center">{page} / {data.totalPages}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GridSkeleton(): React.React.JSX.Element {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-lg" />
      ))}
    </div>
  );
}
