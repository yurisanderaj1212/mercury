'use client';

import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

export default function DashboardPage(): React.React.JSX.Element {
  const token = useAuthStore((s) => s.token);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiClient.get<{
        favoritesCount: number;
        recentAlerts: Array<{ id: string; productName: string; triggeredAt: string | null; triggeredPrice: number | null; currency: string }>;
        newOpportunities: Array<{ publicationId: string; price: number; currency: string; differencePercent: number; opportunityScore: number }>;
      }>('/dashboard', token ?? undefined);
      return res.data;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudo cargar el dashboard.</p>
        <button onClick={() => window.location.reload()} className="mt-3 text-blue-600 text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Favoritos" value={data.favoritesCount} />
        <StatCard label="Alertas disparadas" value={data.recentAlerts.length} />
        <StatCard label="Oportunidades nuevas" value={data.newOpportunities.length} />
        <StatCard label="Hoy" value={new Date().toLocaleDateString('es-CU', { weekday: 'long' })} />
      </div>

      {/* Recent alerts */}
      {data.recentAlerts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Alertas recientes</h2>
          <div className="space-y-2">
            {data.recentAlerts.map((alert) => (
              <div key={alert.id} className="border rounded p-3 text-sm flex justify-between">
                <span className="font-medium">{alert.productName}</span>
                <span className="text-green-600">
                  {alert.triggeredPrice?.toLocaleString()} {alert.currency}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* New opportunities */}
      {data.newOpportunities.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Oportunidades destacadas</h2>
          <div className="space-y-2">
            {data.newOpportunities.slice(0, 5).map((opp) => (
              <div key={opp.publicationId} className="border rounded p-3 text-sm flex justify-between items-center">
                <span>{opp.price.toLocaleString()} {opp.currency}</span>
                <span className="text-green-600 font-medium">
                  {opp.differencePercent.toFixed(1)}% vs promedio
                </span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  Score: {opp.opportunityScore}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }): React.React.JSX.Element {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
