# Jayakrishna Flour Mill: Website (Phase 1: static, dynamic-ready)

React + Vite + React Router. No backend needed for this release.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs dist/ → upload to any static host
```

`public/_redirects` (Netlify/Cloudflare Pages) makes deep links like `/shop/kili-brand-maida` work on refresh.
On Apache use an `.htaccess` rewrite to `index.html`; on Nginx use `try_files $uri /index.html;`.

## Guest → sign-in flow (Amazon/Flipkart style)
- Everyone browses as a guest: home, catalogue, product details, nutrition, etc.
- **Add to cart / Buy now / opening /cart** while signed out → `/login`. The app remembers the product, pack size, quantity and the page the visitor came from, then restores them after sign-in (`AuthContext.requireAuth`, `pages/Auth.jsx`).
- Static release: the sign-in form explains that online accounts open shortly and offers email/WhatsApp. No fake login is exposed.
- Team demo of the full flow: build with `VITE_DEMO_AUTH=true` (accepts any credentials, so **never publish that build**).

## Making it dynamic (week 2)
All data and actions go through **`src/services/api.js`**; pages never import data directly.
1. Build the Express + MySQL API with the routes listed at the top of `api.js`.
2. Set `VITE_USE_API=true` and `VITE_API_BASE=...` in `.env.production`. Optionally `VITE_SHOP_URL` for the separate shopping URL.
3. Replace the static form behaviour (mailto) automatically: `formsApi.submit` posts to `/api/forms/:kind`.

Suggested MySQL tables: `users(role: customer|dealer|supplier|admin, status)`, `products`, `product_packs(size_kg, price, sku, in_stock)`, `dealer_prices(dealer_id, pack_id, price)`, `carts/cart_items`, `orders/order_items`, `form_submissions`, `supplier_quotations`.
Suggested extras: `bcrypt`, `jsonwebtoken` or `express-session`, `zod`, `mysql2` (or Prisma), `multer` (quotation uploads), a payment gateway SDK.

## Theme
Edit **`src/styles/theme.css`** only. Block 1 holds the sister website's tokens verbatim (Playfair Display headings, Plus Jakarta Sans body, loaded from Google Fonts in `index.html`); block 2 maps them to this project's variable names.

## Content still needed from the client (marked `TODO(client)` in code)
Phone / WhatsApp number (`data/site.js`) · prices (`data/products.js`) · real pack photos (`components/BagArt.jsx`) · team, awards, CSR, annual report, careers, facility photos · brand video URL (`pages/Info.jsx`) · Terms, Privacy and Return policy text (`pages/Policies.jsx`) · logo (header uses a text mark).
