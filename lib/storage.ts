import { Favorite, Sample } from './types';

const FAVORITES_KEY = 'rare-grooves-favorites';
const SAMPLES_KEY = 'rare-grooves-samples';

// Favorites
export const getFavorites = (): Favorite[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FAVORITES_KEY);
  if (!stored) return [];
  return JSON.parse(stored).map((fav: Favorite) => ({
    ...fav,
    addedAt: new Date(fav.addedAt)
  }));
};

export const addFavorite = (trackId: string): void => {
  const favorites = getFavorites();
  if (favorites.some(fav => fav.trackId === trackId)) return;
  
  const newFavorite: Favorite = {
    trackId,
    addedAt: new Date()
  };
  
  favorites.push(newFavorite);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  
  // Dispatch custom event for same-tab updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
  }
};

export const removeFavorite = (trackId: string): void => {
  const favorites = getFavorites();
  const filtered = favorites.filter(fav => fav.trackId !== trackId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  
  // Dispatch custom event for same-tab updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
  }
};

export const isFavorite = (trackId: string): boolean => {
  return getFavorites().some(fav => fav.trackId === trackId);
};

// Samples
export const getSamples = (): Sample[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(SAMPLES_KEY);
  if (!stored) return [];
  return JSON.parse(stored).map((sample: Sample) => ({
    ...sample,
    createdAt: new Date(sample.createdAt)
  }));
};

export const saveSample = (sample: Omit<Sample, 'id' | 'createdAt'>): Sample => {
  const samples = getSamples();
  const newSample: Sample = {
    ...sample,
    id: `sample-${Date.now()}`,
    createdAt: new Date()
  };
  
  samples.push(newSample);
  localStorage.setItem(SAMPLES_KEY, JSON.stringify(samples));
  return newSample;
};

export const deleteSample = (sampleId: string): void => {
  const samples = getSamples();
  const filtered = samples.filter(sample => sample.id !== sampleId);
  localStorage.setItem(SAMPLES_KEY, JSON.stringify(filtered));
};

export const getSamplesByTrack = (trackId: string): Sample[] => {
  return getSamples().filter(sample => sample.trackId === trackId);
};
