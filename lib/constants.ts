export const PAGINATION = {
  ITEMS_PER_PAGE: 40,
} as const;

export const DEBOUNCE = {
  SEARCH_DELAY_MS: 300,
} as const;

export const RATE_LIMIT = {
  MAX_REQUESTS: 30,
  WINDOW_MS: 60 * 1000,
} as const;

export const DISCOVERY = {
  MIN_RARITY: 8,
  MAX_RESULTS: 8,
  YEAR_THRESHOLD: 5,
  BPM_THRESHOLD: 10,
  SCORE_SAME_GENRE: 30,
  SCORE_SIMILAR_YEAR: 20,
  SCORE_SIMILAR_BPM: 15,
  SCORE_SAME_KEY: 10,
  SCORE_HIGHER_RARITY: 10,
  SCORE_RANDOM_FACTOR: 15,
} as const;

export const INPUT = {
  MAX_LENGTH: 200,
} as const;

export const AUDIO = {
  PREVIEW_DURATION_SEC: 30,
} as const;

export const UI = {
  SKELETON_COUNT: 10,
  GRID_BREAKPOINTS: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
} as const;
