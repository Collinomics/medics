// Use VITE_USE_MOCK=true to explore the frontend without the API server.
// Production builds should explicitly set this to false.
export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK).toLowerCase() === 'true'
