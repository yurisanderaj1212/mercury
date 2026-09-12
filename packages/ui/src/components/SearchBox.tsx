import React, { useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';

export interface SearchBoxProps {
  value?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  autoFocus?: boolean;
  className?: string;
  minLength?: number;
}

export function SearchBox({
  value = '',
  onSearch,
  placeholder = 'Buscar...',
  debounceMs = 400,
  autoFocus = false,
  className,
  minLength = 2,
}: SearchBoxProps): React.JSX.Element {
  const [input, setInput] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes
  useEffect(() => {
    setInput(value);
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const v = e.target.value;
    setInput(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (v.length === 0 || v.length >= minLength) onSearch(v);
    }, debounceMs);
  }

  function handleClear(): void {
    setInput('');
    onSearch('');
  }

  return (
    <div className={clsx('relative flex items-center', className)}>
      <span className="pointer-events-none absolute left-3 text-gray-400 text-sm">🔍</span>
      <input
        type="search"
        value={input}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={placeholder}
        className="w-full rounded-lg border border-gray-300 pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {input && (
        <button
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
          className="absolute right-2.5 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      )}
    </div>
  );
}
