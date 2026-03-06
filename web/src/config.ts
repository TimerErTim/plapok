export const config = {
  selfBaseUrl: import.meta.env.VITE_PUBLIC_URL ?? "https://plapok.timerertim.eu",
  spacetimeDbUri: import.meta.env.VITE_SPACETIMEDB_URI ?? "https://maincloud.spacetimedb.com",
  spacetimeDbModule: import.meta.env.VITE_SPACETIMEDB_MODULE ?? "timerertim-plapok-01",
};