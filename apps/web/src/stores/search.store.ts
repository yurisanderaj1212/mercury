import { create } from 'zustand';

interface SearchStore {
  query: string;
  categoryId?: string;
  priceMin?: number;
  priceMax?: number;
  locationId?: string;
  source?: string;
  sort: string;
  page: number;
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<Omit<SearchStore, 'setQuery' | 'setFilters' | 'reset'>>) => void;
  reset: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  sort: 'date_desc',
  page: 1,
  setQuery: (query) => set({ query, page: 1 }),
  setFilters: (filters) => set({ ...filters, page: 1 }),
  reset: () => set({ query: '', sort: 'date_desc', page: 1, categoryId: undefined, priceMin: undefined, priceMax: undefined, locationId: undefined, source: undefined }),
}));
