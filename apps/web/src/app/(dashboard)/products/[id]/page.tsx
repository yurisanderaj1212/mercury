'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface MarketStats {
  productId: string;
  currency: string;
  minPrice: number | null;
  maxPrice: number | null;
  avgPrice: number | null;
  activePublicationsCount: number;
  calculatedAt: string;
  opportunities: Array<{
    publicationId: string;
    price: number;
    currency: string;
    differencePercent: number;
    opportunityScore: number;
    classification: string;
  }>;
}

interface PricePoint {
  date: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  categoryName?: string;
  brandName?: string;
}

const CLASSIFICATION_COLOR: Record<string, string> = {
  EXCELENTE: 'bg-green-100 text-green-700',
  BUENA: 'bg-blue-100 text-blue-700',
  MEDIA: 'bg-yellow-100 text-yellow-700',
  NO_RECOMENDADA: 'bg-red-100 text-red-700',
};

export default function ProductDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [showAlertModal, setShowAlertModal] = useState(false);

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await apiClient.get<Product>(`/products/${id}`, token ?? undefined);
      return res.data;
    },
  });

  const { data: market, isLoading: loadingMarket } = useQuery({
    queryKey: ['product-market', id],
    queryFn: async () => {
      const res = await apiClient.get<MarketStats>(`/products/${id}/market`, token ?? undefined);
      return res.data;
    },
  });

  const { data: priceHistory } = useQuery({
    queryKey: ['price-history', id],
    queryFn: async () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await apiClient.get<PricePoint[]>(
        `/products/${id}/price-history?from=${from}&to=${to}`,
        token ?? undefined,
      );
      return res.data ?? [];
    },
  });

  if (loadingProduct) {
    return <div className="animate-pulse space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded" />)}</div>;
  }

  if (!product) {
    return <div className="text-center py-12 text-gray-400 text-sm">Producto no encontrado.</div>;
  }

  const currency = market?.currency ?? 'CUP';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/products" className="text-xs text-gray-400 hover:text-gray-600">← Productos</Link>
        <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
        <div className="flex gap-2 mt-1 text-xs text-gray-500">
          {product.categoryName && <span className="bg-gray-100 px-2 py-0.5 rounded">{product.categoryName}</span>}
          {product.brandName && <span className="bg-gray-100 px-2 py-0.5 rounded">{product.brandName}</span>}
        </div>
        {product.description && <p className="text-sm text-gray-600 mt-2">{product.description}</p>}
      </div>

      <section className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Estadísticas de mercado</h2>
          <button
            onClick={() => setShowAlertModal(true)}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
          >
            + Crear alerta
          </button>
        </div>
        {loadingMarket ? (
          <div className="animate-pulse h-16 bg-gray-100 rounded" />
        ) : !market || market.activePublicationsCount === 0 ? (
          <p className="text-sm text-gray-400">Sin publicaciones activas en este momento.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="Mínimo" value={market.minPrice} currency={currency} />
            <StatBox label="Promedio" value={market.avgPrice} currency={currency} />
            <StatBox label="Máximo" value={market.maxPrice} currency={currency} />
            <StatBox label="Publicaciones" value={market.activePublicationsCount} />
          </div>
        )}
      </section>

      {priceHistory && priceHistory.length > 0 && (
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold text-sm mb-3">Historial de precios (30 días)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString()} ${currency}`} />
              <Line type="monotone" dataKey="avgPrice" stroke="#2563eb" strokeWidth={2} dot={false} name="Promedio" />
              <Line type="monotone" dataKey="minPrice" stroke="#16a34a" strokeWidth={1} dot={false} name="Mínimo" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {market && market.opportunities && market.opportunities.length > 0 && (
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold text-sm mb-3">Oportunidades de compra</h2>
          <div className="space-y-2">
            {market.opportunities
              .sort((a, b) => b.opportunityScore - a.opportunityScore)
              .map((opp) => (
                <Link
                  key={opp.publicationId}
                  href={`/publications/${opp.publicationId}`}
                  className="flex items-center justify-between border rounded p-3 hover:shadow-sm transition-shadow"
                >
                  <div>
                    <span className="font-medium text-sm">{opp.price.toLocaleString()} {opp.currency}</span>
                    <span className="ml-2 text-xs text-green-600">
                      {opp.differencePercent > 0 ? '-' : '+'}{Math.abs(opp.differencePercent).toFixed(1)}% vs promedio
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Score {opp.opportunityScore}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${CLASSIFICATION_COLOR[opp.classification] ?? 'bg-gray-100 text-gray-600'}`}>
                      {opp.classification}
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      )}

      {showAlertModal && product && (
        <AlertModal
          productId={product.id}
          productName={product.name}
          onClose={() => setShowAlertModal(false)}
        />
      )}
    </div>
  );
}

function StatBox({ label, value, currency }: { label: string; value: number | null | undefined; currency?: string }): React.JSX.Element {
  return (
    <div className="bg-gray-50 rounded p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold text-sm mt-1">
        {value == null ? '—' : `${value.toLocaleString()}${currency ? ` ${currency}` : ''}`}
      </p>
    </div>
  );
}

function AlertModal({ productId, productName, onClose }: { productId: string; productName: string; onClose: () => void }): React.JSX.Element {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [price, setPrice] = useState('');
  const [alertType, setAlertType] = useState('PRICE_BELOW');
  const [currency, setCurrency] = useState('CUP');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/alerts', { productId, maximumPrice: Number(price), currency, alertType }, token ?? undefined);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alerts'] });
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message === 'ALERT_LIMIT_REACHED' ? 'Alcanzaste el límite de 20 alertas activas.' : err.message);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm space-y-4">
        <h3 className="font-semibold">Nueva alerta — {productName}</h3>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Tipo de alerta</label>
          <select value={alertType} onChange={(e) => setAlertType(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
            <option value="PRICE_BELOW">Precio menor que</option>
            <option value="PRICE_ABOVE">Precio mayor que</option>
            <option value="NEW_PRODUCT_MATCH">Nueva publicación</option>
            <option value="HIGH_OPPORTUNITY">Alta oportunidad</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Precio umbral</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="25000" className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Moneda</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
            {['CUP', 'USD', 'MLC', 'EUR'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 border rounded px-3 py-2 text-sm">Cancelar</button>
          <button onClick={() => mutation.mutate()} disabled={!price || mutation.isPending} className="flex-1 bg-blue-600 text-white rounded px-3 py-2 text-sm disabled:opacity-50">
            {mutation.isPending ? 'Guardando...' : 'Crear alerta'}
          </button>
        </div>
      </div>
    </div>
  );
}
