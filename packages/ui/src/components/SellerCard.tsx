import React from 'react';
import { clsx } from 'clsx';

export interface SellerCardProps {
  name: string;
  phone?: string;
  publicationCount?: number;
  className?: string;
}

export function SellerCard({
  name,
  phone,
  publicationCount,
  className,
}: SellerCardProps): React.JSX.Element {
  return (
    <div className={clsx('rounded-lg border bg-white p-3', className)}>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          {phone && <p className="text-xs text-gray-500">{phone}</p>}
        </div>
        {publicationCount !== undefined && (
          <span className="text-xs text-gray-400 shrink-0">
            {publicationCount} pub.
          </span>
        )}
      </div>
    </div>
  );
}
