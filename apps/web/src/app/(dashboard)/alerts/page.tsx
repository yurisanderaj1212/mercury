'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { useAlertsStore } from '@/stores/alerts.store';
import { apiClient } from '@/lib/api-client';

interface AlertItem {
  id: string;
  productId: string;
  productName?: string;
  maximumPrice: number;
  currency: string;
  alertType: string;
  changePercent?: number;
  status: string;
  triggeredAt?: string;
  triggeredPrice?: number;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  TRIGGERED: 'bg-blue-100 text-blue-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  DELETED: 'bg-gray-100 text-gray-500',
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  PRICE_BELOW: 'Precio menor que',
  PRICE_ABOVE: 'Precio mayor que',
  PRICE_CHANGE_PERCENT: 'Variación de precio',
  NEW_PRODUCT_MATCH: 'Nueva publicación',
  HIGH_OPPORTUNITY: 'Alta oportunidad',
  MARKET_CHANGE: 'Cambio de mercado',
};

const PERSONAL_LIMIT = 20;

export default function AlertsPage(): JSX.Element {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await apiClient.get<{ items: AlertItem[]; total: number }>(
        '/alerts',
        token ?? undefined,
      );
      return res.data;
    },
    enabled: !!token,
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'PAUSED' }) => {
      await apiClient.patch(`/alerts/${id}`, { status }, token ?? undefined);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/alerts/${id}`, token ?? undefined);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const activeCount = data?.items.filter((a) => a.status === 'ACTIVE').length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Alertas</h1>
          <p className="text-xs text-gray-500 mt-0.5">{activeCount} / {PERSONAL_LIMIT} alertas activas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={activeCount >= PERSONAL_LIMIT}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Nueva alerta
        </button>
      </div>

      {/* Limit bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${activeCount >= PERSONAL_LIMIT ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${Math.min((activeCount / PERSONAL_LIMIT) * 100, 100)}%` }}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded" />)}
        </div>
      ) : isError || !data ? (
        <div className="text-center py-12 text-gray-400 text-sm">Error al cargar alertas.</div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-sm">Sin alertas configuradas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.items.map((alert) => (
            <div key={alert.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{alert.productName ?? alert.productId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[alert.status] ?? 'bg-gray-100'}`}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {ALERT_TYPE_LABELS[alert.alertType] ?? alert.alertType}
                    {' '}
                    <span className="font-medium text-gray-700">
                      {alert.maximumPrice.toLocaleString()} {alert.currency}
                    </span>
                    {alert.changePercent && ` (${alert.changePercent}%)`}
                  </p>
                  {alert.triggeredAt && alert.triggeredPrice && (
                    <p className="text-xs text-blue-600 mt-0.5">
                      Disparada el {new Date(alert.triggeredAt).toLocaleDateString('es-CU')} — {alert.triggeredPrice.toLocaleString()} {alert.currency}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Creada el {new Date(alert.createdAt).toLocaleDateString('es-CU')}
                  </p>
                </div>

                {/* Actions */}
                {alert.status !== 'DELETED' && (
                  <div className="flex gap-1 shrink-0">
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => patchMutation.mutate({ id: alert.id, status: 'PAUSED' })}
                        className="text-xs border px-2 py-1 rounded hover:bg-gray-50"
                      >
                        Pausar
                      </button>
                    )}
                    {alert.status === 'PAUSED' && (
                      <button
                        onClick={() => patchMutation.mutate({ id: alert.id, status: 'ACTIVE' })}
                        className="text-xs border px-2 py-1 rounded hover:bg-gray-50 text-green-600"
                      >
                        Activar
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(alert.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewAlertModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            void queryClient.invalidateQueries({ queryKey: ['alerts'] });
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function NewAlertModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }): JSX.Element {
  const token = useAuthStore((s) => s.token);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [alertType, setAlertType] = useState('PRICE_BELOW');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('CUP');
  const [changePercent, setChangePercent] = useState('');
  const [error, setError] = useState('');

  const needsPercent = alertType === 'PRICE_CHANGE_PERCENT' || alertType === 'MARKET_CHANGE';

  const { data: productResults } = useQuery({
    queryKey: ['product-search-modal', productSearch],
    queryFn: async () => {
      if (productSearch.length < 2) return [];
      const res = await apiClient.get<{ items: Product[] }>(
        `/products?name=${encodeURIComponent(productSearch)}&limit=10`,
        token ?? undefined,
      );
      return res.data?.items ?? [];
    },
    enabled: productSearch.length >= 2,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error('Selecciona un producto');
      const body: Record<string, unknown> = {
        productId: selectedProduct.id,
        maximumPrice: Number(price),
        currency,
        alertType,
      };
      if (needsPercent) body.changePercent = Number(changePercent);
      await apiClient.post('/alerts', body, token ?? undefined);
    },
    onSuccess: onCreated,
    onError: (err: Error) => {
      setError(err.message === 'ALERT_LIMIT_REACHED' ? 'Alcanzaste el límite de 20 alertas activas.' : err.message);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm space-y-4">
        <h3 className="font-semibold">Nueva alerta</h3>

        {/* Product search */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Producto</label>
          {selectedProduct ? (
            <div className="flex items-center justify-between border rounded px-3 py-2 text-sm">
              <span>{selectedProduct.name}</span>
              <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-red-500">×</button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
              {productResults && productResults.length > 0 && (
                <div className="border rounded mt-1 max-h-32 overflow-y-auto">
                  {productResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedProduct(p); setProductSearch(''); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Tipo de alerta</label>
          <select value={alertType} onChange={(e) => setAlertType(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
            {Object.entries(ALERT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Precio umbral</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="25000" className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div className="w-20">
            <label className="text-xs text-gray-500 block mb-1">Moneda</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
              {['CUP', 'USD', 'MLC', 'EUR'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {needsPercent && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Variación (%)</label>
            <input type="number" value={changePercent} onChange={(e) => setChangePercent(e.target.value)} placeholder="5" min="0.01" max="100" className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        )}

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 border rounded px-3 py-2 text-sm">Cancelar</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!selectedProduct || !price || mutation.isPending || (needsPercent && !changePercent)}
            className="flex-1 bg-blue-600 text-white rounded px-3 py-2 text-sm disabled:opacity-50"
          >
            {mutation.isPending ? 'Guardando...' : 'Crear alerta'}
          </button>
        </div>
      </div>
    </div>
  );
}
