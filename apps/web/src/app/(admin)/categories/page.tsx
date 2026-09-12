'use client';

import React from 'react';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentCategoryId?: string;
  childrenCount: number;
  createdAt: string;
}

export default function AdminCategoriesPage(): React.JSX.Element {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);

  const { data: roots, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await apiClient.get<Category[]>('/categories', token ?? undefined);
      return res.data ?? [];
    },
  });

  const { data: children } = useQuery({
    queryKey: ['admin-categories-children', selectedParent?.id],
    queryFn: async () => {
      if (!selectedParent) return [];
      const res = await apiClient.get<Category[]>(`/categories/${selectedParent.id}/children`, token ?? undefined);
      return res.data ?? [];
    },
    enabled: !!selectedParent,
  });

  const createMutation = useMutation({
    mutationFn: async (body: { name: string; slug: string; description?: string; parentCategoryId?: string }) => {
      await apiClient.post('/categories', body, token ?? undefined);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      if (selectedParent) void queryClient.invalidateQueries({ queryKey: ['admin-categories-children'] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: { name?: string; description?: string } }) => {
      await apiClient.patch(`/categories/${id}`, body, token ?? undefined);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-categories-children'] });
      setEditTarget(null);
    },
  });

  const displayList = selectedParent ? (children ?? []) : (roots ?? []);
  const breadcrumb = selectedParent ? ['Raíz', selectedParent.name] : ['Raíz'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Categorías</h1>
          <p className="text-xs text-gray-500 mt-0.5">{breadcrumb.join(' › ')}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          + Nueva categoría
        </button>
      </div>

      {selectedParent && (
        <button
          onClick={() => setSelectedParent(null)}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Volver a raíz
        </button>
      )}

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded" />)}
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {selectedParent ? 'Esta categoría no tiene subcategorías.' : 'No hay categorías.'}
        </div>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {displayList.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{cat.name}</p>
                <p className="text-xs text-gray-400">
                  {cat.slug}
                  {cat.childrenCount > 0 && ` · ${cat.childrenCount} subcategorías`}
                  {cat.description && ` · ${cat.description}`}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {cat.childrenCount > 0 && (
                  <button
                    onClick={() => setSelectedParent(cat)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Ver hijos →
                  </button>
                )}
                <button
                  onClick={() => setEditTarget(cat)}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CategoryFormModal
          title="Nueva categoría"
          parentId={selectedParent?.id}
          onSubmit={(body) => createMutation.mutate(body)}
          onClose={() => setShowCreate(false)}
          isPending={createMutation.isPending}
          error={createMutation.error?.message}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <CategoryFormModal
          title={`Editar: ${editTarget.name}`}
          initial={{ name: editTarget.name, description: editTarget.description }}
          onSubmit={(body) => updateMutation.mutate({ id: editTarget.id, body })}
          onClose={() => setEditTarget(null)}
          isPending={updateMutation.isPending}
          error={updateMutation.error?.message}
          isEdit
        />
      )}
    </div>
  );
}

interface FormData {
  name: string;
  slug: string;
  description?: string;
  parentCategoryId?: string;
}

function CategoryFormModal({
  title, parentId, initial, onSubmit, onClose, isPending, error, isEdit,
}: {
  title: string;
  parentId?: string;
  initial?: Partial<FormData>;
  onSubmit: (body: FormData) => void;
  onClose: () => void;
  isPending: boolean;
  error?: string;
  isEdit?: boolean;
}): React.JSX.Element {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  function buildSlug(n: string): string {
    return n.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function handleNameChange(v: string): void {
    setName(v);
    if (!isEdit && !slug) setSlug(buildSlug(v));
  }

  function handleSubmit(): void {
    const body: FormData = {
      name,
      slug: slug || buildSlug(name),
      description: description || undefined,
    };
    if (!isEdit && parentId) body.parentCategoryId = parentId;
    onSubmit(body);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm space-y-4">
        <h3 className="font-semibold">{title}</h3>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Nombre</label>
          <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>

        {!isEdit && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Slug</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="kebab-case" />
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500 block mb-1">Descripción (opcional)</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>

        {error && <p className="text-red-500 text-xs">{error === 'CATEGORY_NAME_DUPLICATE' ? 'Ya existe una categoría con ese nombre.' : error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 border rounded px-3 py-2 text-sm">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={!name || isPending}
            className="flex-1 bg-blue-600 text-white rounded px-3 py-2 text-sm disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
