// Shared prop types for Mercury UI components

export interface PriceBadgeProps {
  price: number;
  currency: string;
  className?: string;
}

export interface OpportunityBadgeProps {
  differencePercent: number;
  score: number;
  className?: string;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
