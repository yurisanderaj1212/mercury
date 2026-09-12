import React from 'react';
import { clsx } from 'clsx';

export interface PriceBadgeProps {
  price: number;
  currency: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'text-xs font-semibold',
  md: 'text-sm font-bold',
  lg: 'text-xl font-bold',
};

export function PriceBadge({
  price,
  currency,
  size = 'md',
  className,
}: PriceBadgeProps): React.JSX.Element {
  const formatted = new Intl.NumberFormat('es-CU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);

  return (
    <span className={clsx(SIZE_CLASSES[size], 'tabular-nums', className)}>
      {formatted}{' '}
      <span className="font-normal text-gray-500">{currency}</span>
    </span>
  );
}
