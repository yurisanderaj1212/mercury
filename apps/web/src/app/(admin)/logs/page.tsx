'use client';

import React from 'react';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

interface LogEntry {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user: { email: string; fullName: string };
}

const ENTITY_OPTIONS = ['', 'user', 'publication', 'category', 'alert'];

export default function AdminLogsPage(): React.JSX.Element {
  const token = useAuthStore((s) => s.token);
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '50' });
  if (entityFilter) params.set('entity', entityFilter);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-logs', page, entityFilter],
    queryFn: async () => {
      const res = await apiClient.get<{ items: LogEntry[]; meta: { total: number; totalPages: number } }>(
        `/admin/logs?${params.toString()}`,
        token ?? undefined,
      );
      return res.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Auditoría</h1>
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">Todas las entidades</option>
          {ENTITY_OPTIONS.filter(Boolean).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-gray-100 rounded" />)}
        </div>
      ) : isError || !data ? (
        <div className="text-center py-12 text-gray-400 text-sm">Error al cargar logs.</div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Sin registros.</div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{data.meta.total} entradas</p>
          <div className="bg-white border rounded-lg divide-y">
            {data.items.map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">{log.action}</span>
                    <span className="text-xs text-gray-500">en <strong>{log.entity}</strong></span>
                    {log.entityId && (
                      <span className="text-xs text-gray-400 font-mono truncate max-w-[120px]">{log.entityId}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    por <span className="font-medium">{log.user.fullName}</span> ({log.user.email})
                  </p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
                <time className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                  {new Date(log.createdAt).toLocaleString('es-CU')}
                </time>
              </div>
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className="px-3 py-1 text-sm border rounded disabled:opacity-40">← Anterior</button>
              <span className="text-sm text-gray-600 self-center">{page} / {data.meta.totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.meta.totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-40">Siguiente →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
