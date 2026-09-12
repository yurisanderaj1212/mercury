import React from 'react';
import { clsx } from 'clsx';
import { PriceBadge } from './PriceBadge';

export interface ProductCardProps {
  id: string;
  name: string;
  categoryName?: string;
  brandName?: string;
  description?: string;
  onClick?: (id: string) => void;
  className?: string;
}

export function ProductCard({
  id,
  name,
  categoryName,
  brandName,
  description,
  onClick,
  className,
}: ProductCardProps): React.JSX.Element {
  return (
    <article
      onClick={() => onClick?.(id)}
      className={clsx(
        'rounded-lg border bg-white p-4 transition-shadow',
        onClick && 'cursor-pointer hover:shadow-sm',
        className,
      )}
    >
      <p className="font-medium text-sm">{name}</p>
      <div className="flex gap-1.5 mt-1 flex-wrap">
        {categoryName && (
          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
            {categoryName}
          </span>
        )}
        {brandName && (
          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
            {brandName}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{description}</p>
      )}
    </article>
  );
}
