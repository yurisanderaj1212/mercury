import { create } from 'zustand';

interface FavoritesStore {
  favoriteIds: Set<string>;
  addFavorite: (publicationId: string) => void;
  removeFavorite: (publicationId: string) => void;
  isFavorite: (publicationId: string) => boolean;
  setFavorites: (ids: string[]) => void;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favoriteIds: new Set(),
  addFavorite: (id) => set((state) => ({ favoriteIds: new Set([...state.favoriteIds, id]) })),
  removeFavorite: (id) => set((state) => {
    const next = new Set(state.favoriteIds);
    next.delete(id);
    return { favoriteIds: next };
  }),
  isFavorite: (id) => get().favoriteIds.has(id),
  setFavorites: (ids) => set({ favoriteIds: new Set(ids) }),
}));
