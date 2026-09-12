import React from 'react';
import { clsx } from 'clsx';
import { PriceBadge } from './PriceBadge';
import { OpportunityBadge } from './OpportunityBadge';

export interface PublicationCardProps {
  id: string;
  title: string;
  price: number;
  currency: string;
  productName?: string;
  sellerName?: string;
  sourceName?: string;
  municipality?: string;
  createdAt: string | Date;
  opportunityScore?: number;
  differencePercent?: number;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
}

export function PublicationCard({
  id,
  title,
  price,
  currency,
  productName,
  sellerName,
  sourceName,
  municipality,
  createdAt,
  opportunityScore,
  differencePercent,
  isFavorite,
  onFavoriteToggle,
  onClick,
  className,
}: PublicationCardProps): React.JSX.Element {
  const date = new Date(createdAt).toLocaleDateString('es-CU');

  return (
    <article
      onClick={() => onClick?.(id)}
      className={clsx(
        'rounded-lg border bg-white p-4 transition-shadow',
        onClick && 'cursor-pointer hover:shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {[productName, sellerName].filter(Boolean).join(' · ')}
          </p>
          {(municipality ?? sourceName) && (
            <p className="text-xs text-gray-400 mt-0.5">
              {[municipality, sourceName].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        <div className="text-right shrink-0 space-y-1">
          <PriceBadge price={price} currency={currency} />
          <p className="text-xs text-gray-400">{date}</p>
        </div>
      </div>

      {opportunityScore !== undefined && differencePercent !== undefined && (
        <div className="mt-2">
          <OpportunityBadge
            score={opportunityScore}
            differencePercent={differencePercent}
            showScore
          />
        </div>
      )}

      {onFavoriteToggle && (
        <button
          onClick={(e) => { e.stopPropagation(); onFavoriteToggle(id); }}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          className={clsx(
            'mt-2 text-xs transition-colors',
            isFavorite ? 'text-red-500 hover:text-red-700' : 'text-gray-400 hover:text-red-400',
          )}
        >
          {isFavorite ? '♥ En favoritos' : '♡ Favorito'}
        </button>
      )}
    </article>
  );
}
