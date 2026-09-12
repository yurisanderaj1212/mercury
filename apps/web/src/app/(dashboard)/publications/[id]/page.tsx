'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { useFavoritesStore } from '@/stores/favorites.store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

interface PublicationDetail {
  id: string;
  productId: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  status: string;
  publicationUrl?: string;
  publicationDate: string;
  createdAt: string;
  updatedAt: string;
  seller?: { id: string; name: string; phone?: string };
  source?: { id: string; name: string };
  location?: { municipality: string; province?: string };
  product?: { id: string; name: string; categoryName?: string };
  images?: Array<{ id: string; url: string }>;
}

export default function PublicationDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const { favoriteIds, addFavorite, removeFavorite, setFavorites, isFavorite } = useFavoritesStore();

  const { data: publication, isLoading, isError } = useQuery({
    queryKey: ['publication', id],
    queryFn: async () => {
      const res = await apiClient.get<PublicationDetail>(`/publications/${id}`, token ?? undefined);
      return res.data;
    },
  });

  // Sync favorites from server
  const { data: favs } = useQuery({
    queryKey: ['favorites-ids'],
    queryFn: async () => {
      const res = await apiClient.get<{ items: Array<{ id: string; publicationId: string }> }>(
        '/favorites?limit=200',
        token ?? undefined,
      );
      return res.data?.items ?? [];
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (favs) setFavorites(favs.map((f) => f.publicationId));
  }, [favs, setFavorites]);

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite(id)) {
        await apiClient.delete(`/favorites/${id}`, token ?? undefined);
      } else {
        await apiClient.post('/favorites', { publicationId: id }, token ?? undefined);
      }
    },
    onMutate: () => {
      // Optimistic update
      if (isFavorite(id)) removeFavorite(id);
      else addFavorite(id);
    },
    onError: () => {
      // Rollback
      if (isFavorite(id)) removeFavorite(id);
      else addFavorite(id);
      void queryClient.invalidateQueries({ queryKey: ['favorites-ids'] });
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 max-w-2xl">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded" />)}
      </div>
    );
  }

  if (isError || !publication) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">Publicación no encontrada o no disponible.</p>
        <Link href="/search" className="text-blue-600 text-sm mt-2 block">← Volver a búsqueda</Link>
      </div>
    );
  }

  const isFav = isFavorite(id);

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href="/search" className="text-xs text-gray-400 hover:text-gray-600">← Volver</Link>
      </div>

      {/* Images */}
      {publication.images && publication.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {publication.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id} src={img.url} alt={publication.title} className="h-40 w-auto rounded border object-cover shrink-0" />
          ))}
        </div>
      )}

      {/* Title + price */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold">{publication.title}</h1>
          {publication.product && (
            <Link href={`/products/${publication.product.id}`} className="text-xs text-blue-600 hover:underline">
              {publication.product.name}
              {publication.product.categoryName && ` · ${publication.product.categoryName}`}
            </Link>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold">{publication.price.toLocaleString()} {publication.currency}</p>
          <span className={`text-xs px-2 py-0.5 rounded ${publication.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {publication.status}
          </span>
        </div>
      </div>

      {/* Favorite button */}
      <button
        onClick={() => favoriteMutation.mutate()}
        disabled={favoriteMutation.isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded border text-sm font-medium transition-colors ${
          isFav ? 'bg-red-50 border-red-200 text-red-600' : 'hover:bg-gray-50'
        }`}
      >
        {isFav ? '♥ En favoritos' : '♡ Agregar a favoritos'}
      </button>

      {/* Description */}
      {publication.description && (
        <div className="border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-2">Descripción</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line">{publication.description}</p>
        </div>
      )}

      {/* Details */}
      <div className="border rounded-lg p-4 space-y-2 text-sm">
        <h2 className="font-semibold mb-2">Detalles</h2>
        {publication.seller && (
          <Row label="Vendedor" value={`${publication.seller.name}${publication.seller.phone ? ` · ${publication.seller.phone}` : ''}`} />
        )}
        {publication.source && <Row label="Fuente" value={publication.source.name} />}
        {publication.location && (
          <Row label="Ubicación" value={[publication.location.municipality, publication.location.province].filter(Boolean).join(', ')} />
        )}
        <Row label="Publicado" value={new Date(publication.publicationDate).toLocaleDateString('es-CU')} />
        <Row label="Registrado" value={new Date(publication.createdAt).toLocaleDateString('es-CU')} />
        {publication.publicationUrl && (
          <div className="flex justify-between">
            <span className="text-gray-500">Enlace original</span>
            <a href={publication.publicationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs truncate max-w-[60%]">
              Ver publicación →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-right text-gray-800">{value}</span>
    </div>
  );
}
