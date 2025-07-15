export const APP_CONFIG = {
  name: 'Edify',
  description: 'Share Your Ideas',
  url: import.meta.env.PROD ? 'https://edify.exposition.lk' : 'http://localhost:5173',
  version: '1.0.0'
};

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:1337',
  timeout: 10000
};

export const STORAGE_KEYS = {
  user: 'edify-user',
  theme: 'edify-theme',
  drafts: 'edify-drafts'
};