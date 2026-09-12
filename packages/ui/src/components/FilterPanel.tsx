import React from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterPanelProps {
  categoryOptions?: FilterOption[];
  sourceOptions?: FilterOption[];
  categoryId?: string;
  priceMin?: number;
  priceMax?: number;
  source?: string;
  onCategoryChange?: (id: string | undefined) => void;
  onPriceMinChange?: (v: number | undefined) => void;
  onPriceMaxChange?: (v: number | undefined) => void;
  onSourceChange?: (s: string | undefined) => void;
  onReset?: () => void;
}

export function FilterPanel({
  categoryOptions = [],
  sourceOptions = [],
  categoryId,
  priceMin,
  priceMax,
  source,
  onCategoryChange,
  onPriceMinChange,
  onPriceMaxChange,
  onSourceChange,
  onReset,
}: FilterPanelProps): React.JSX.Element {
  return (
    <aside className="w-full space-y-4 rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold">Filtros</h3>

      {categoryOptions.length > 0 && (
        <FilterGroup label="Categoría">
          <select
            value={categoryId ?? ''}
            onChange={(e) => onCategoryChange?.(e.target.value || undefined)}
            className="w-full rounded border px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {categoryOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FilterGroup>
      )}

      <FilterGroup label="Precio mínimo">
        <input
          type="number"
          value={priceMin ?? ''}
          onChange={(e) => onPriceMinChange?.(e.target.value ? Number(e.target.value) : undefined)}
          placeholder="0"
          min={0}
          className="w-full rounded border px-2 py-1.5 text-sm"
        />
      </FilterGroup>

      <FilterGroup label="Precio máximo">
        <input
          type="number"
          value={priceMax ?? ''}
          onChange={(e) => onPriceMaxChange?.(e.target.value ? Number(e.target.value) : undefined)}
          placeholder="Sin límite"
          min={0}
          className="w-full rounded border px-2 py-1.5 text-sm"
        />
      </FilterGroup>

      {sourceOptions.length > 0 && (
        <FilterGroup label="Fuente">
          <select
            value={source ?? ''}
            onChange={(e) => onSourceChange?.(e.target.value || undefined)}
            className="w-full rounded border px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {sourceOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FilterGroup>
      )}

      {onReset && (
        <button
          onClick={onReset}
          className="w-full text-xs text-gray-400 hover:text-red-500 pt-1 text-left"
        >
          Limpiar filtros
        </button>
      )}
    </aside>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
