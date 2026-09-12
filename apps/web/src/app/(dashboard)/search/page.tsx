'use client';

import React from 'react';

import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchStore } from '@/stores/search.store';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  productId: string;
  productName: string;
  sellerName: string;
  sourceName: string;
  municipality?: string;
  publicationUrl?: string;
  createdAt: string;
}

interface SearchResponse {
  items: SearchResultItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Category {
  id: string;
  name: string;
}

interface Location {
  id: string;
  municipality: string;
}

const SOURCES = ['FACEBOOK', 'REVOLICO', 'MANUAL', 'IMPORT', 'API'];
const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
];

export default function SearchPage(): React.JSX.Element {
  const token = useAuthStore((s) => s.token);
  const store = useSearchStore();
  const [inputValue, setInputValue] = useState(store.query);
  const [debouncedQuery, setDebouncedQuery] = useState(store.query);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(inputValue);
      store.setQuery(inputValue);
    }, 400);
    return () => clearTimeout(t);
  }, [inputValue]);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (debouncedQuery) p.set('q', debouncedQuery);
    if (store.categoryId) p.set('category', store.categoryId);
    if (store.priceMin !== undefined) p.set('price_min', String(store.priceMin));
    if (store.priceMax !== undefined) p.set('price_max', String(store.priceMax));
    if (store.locationId) p.set('location', store.locationId);
    if (store.source) p.set('source', store.source);
    p.set('sort', store.sort);
    p.set('page', String(store.page));
    p.set('limit', '20');
    return p.toString();
  }, [debouncedQuery, store.categoryId, store.priceMin, store.priceMax, store.locationId, store.source, store.sort, store.page]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', debouncedQuery, store.categoryId, store.priceMin, store.priceMax, store.locationId, store.source, store.sort, store.page],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;
      const res = await apiClient.get<SearchResponse>(`/search?${buildParams()}`, token ?? undefined);
      return res.data;
    },
    enabled: debouncedQuery.length >= 2,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<Category[]>('/categories', token ?? undefined);
      return res.data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Buscar producto... (mínimo 2 caracteres)"
          className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>

      <div className="flex gap-4 flex-col md:flex-row">
        {/* Filters panel */}
        <aside className="w-full md:w-56 shrink-0 space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold">Filtros</h3>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Categoría</label>
              <select
                value={store.categoryId ?? ''}
                onChange={(e) => store.setFilters({ categoryId: e.target.value || undefined })}
                className="w-full border rounded px-2 py-1.5 text-sm"
              >
                <option value="">Todas</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Precio mínimo</label>
              <input
                type="number"
                value={store.priceMin ?? ''}
                onChange={(e) => store.setFilters({ priceMin: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0"
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Precio máximo</label>
              <input
                type="number"
                value={store.priceMax ?? ''}
                onChange={(e) => store.setFilters({ priceMax: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Sin límite"
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Fuente</label>
              <select
                value={store.source ?? ''}
                onChange={(e) => store.setFilters({ source: e.target.value || undefined })}
                className="w-full border rounded px-2 py-1.5 text-sm"
              >
                <option value="">Todas</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => { store.reset(); setInputValue(''); setDebouncedQuery(''); }}
              className="w-full text-xs text-gray-500 hover:text-red-500 pt-1"
            >
              Limpiar filtros
            </button>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 space-y-3">
          {/* Sort + count bar */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {data ? `${data.total} resultados` : ''}
            </span>
            <select
              value={store.sort}
              onChange={(e) => store.setFilters({ sort: e.target.value })}
              className="border rounded px-2 py-1 text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* States */}
          {!debouncedQuery || debouncedQuery.length < 2 ? (
            <EmptyPrompt />
          ) : isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <ErrorState />
          ) : !data || data.items.length === 0 ? (
            <NoResults query={debouncedQuery} />
          ) : (
            <>
              <div className="space-y-2">
                {data.items.map((item) => (
                  <PublicationCard key={item.id} item={item} />
                ))}
              </div>
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onPageChange={(p) => store.setFilters({ page: p })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PublicationCard({ item }: { item: SearchResultItem }): React.JSX.Element {
  return (
    <Link href={`/publications/${item.id}`} className="block border rounded-lg p-4 hover:shadow-sm transition-shadow bg-white">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{item.productName} · {item.sellerName}</p>
          {item.municipality && (
            <p className="text-xs text-gray-400 mt-0.5">{item.municipality} · {item.sourceName}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-sm">{item.price.toLocaleString()} {item.currency}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(item.createdAt).toLocaleDateString('es-CU')}
          </p>
        </div>
      </div>
    </Link>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }): React.JSX.Element {
  if (totalPages <= 1) return <></>;
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 text-sm border rounded disabled:opacity-40"
      >
        ← Anterior
      </button>
      <span className="text-sm text-gray-600">{page} / {totalPages}</span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1 text-sm border rounded disabled:opacity-40"
      >
        Siguiente →
      </button>
    </div>
  );
}

function EmptyPrompt(): React.JSX.Element {
  return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-4xl mb-3">🔍</p>
      <p className="text-sm">Escribe al menos 2 caracteres para buscar</p>
    </div>
  );
}

function NoResults({ query }: { query: string }): React.JSX.Element {
  return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-4xl mb-3">😶</p>
      <p className="text-sm">Sin resultados para <strong className="text-gray-600">"{query}"</strong></p>
    </div>
  );
}

function LoadingSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-lg" />
      ))}
    </div>
  );
}

function ErrorState(): React.JSX.Element {
  return (
    <div className="text-center py-12 text-red-500">
      <p className="text-sm">Error al buscar. Verifica tu conexión.</p>
    </div>
  );
}
