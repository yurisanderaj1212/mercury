import React from 'react';

// ─── EmptyState ───────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({
  title,
  description,
  icon = '😶',
  action,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 space-y-2">
      <span className="text-4xl" role="img" aria-hidden="true">{icon}</span>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {description && <p className="text-xs max-w-xs">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── LoadingSkeleton ──────────────────────────────────────────────────────────

export interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ rows = 3, className }: LoadingSkeletonProps): React.JSX.Element {
  return (
    <div className={`space-y-2 animate-pulse ${className ?? ''}`} aria-label="Cargando...">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-lg bg-gray-100"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────────────────────

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Ocurrió un error inesperado.',
  onRetry,
}: ErrorStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
      <span className="text-3xl" role="img" aria-hidden="true">⚠️</span>
      <p className="text-sm text-gray-600">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm text-blue-600 hover:underline">
          Reintentar
        </button>
      )}
    </div>
  );
}

// ─── OfflineState ─────────────────────────────────────────────────────────────

export function OfflineState(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
      <span className="text-3xl" role="img" aria-hidden="true">📡</span>
      <p className="text-sm font-medium text-gray-600">Sin conexión</p>
      <p className="text-xs text-gray-400">Verifica tu conexión a internet e intenta de nuevo.</p>
    </div>
  );
}
