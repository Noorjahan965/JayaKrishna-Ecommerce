// One place that decides "static" vs "dynamic".
// Going dynamic = set VITE_USE_API=true (and VITE_API_BASE) in .env.production. No page code changes.
export const config = {
  // false → data comes from src/data/*.js. true → data comes from the Node/Express API.
  useApi: import.meta.env.VITE_USE_API === 'true',
  apiBase: import.meta.env.VITE_API_BASE || '',
  // Lets the team click through the sign-in → cart flow before the backend exists.
  // NEVER enable on the public static release: it accepts any credentials.
  demoAuth: import.meta.env.VITE_DEMO_AUTH === 'true',
  // Separate shopping URL (e.g. https://shop.jayakrishnaflourmill.com). Empty = same site, /shop.
  shopUrl: (import.meta.env.VITE_SHOP_URL || '').replace(/\/$/, ''),
};
