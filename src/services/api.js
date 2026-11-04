// ---------------------------------------------------------------------------
// API LAYER. Every page talks to the backend ONLY through this file.
// Static release  → functions resolve from src/data/*.js (or open mailto for forms).
// Dynamic release → set VITE_USE_API=true; the same functions call Express.
//
// Planned Express routes (all JSON):
//   GET  /api/products            GET /api/products/:slug
//   POST /api/auth/login          POST /api/auth/register   POST /api/auth/logout   GET /api/auth/me
//   GET  /api/cart                PUT  /api/cart            POST /api/orders
//   POST /api/forms/:kind         (dealer-enquiry | supplier-registration | contact | career)
// Auth: httpOnly cookie session (credentials: 'include'); roles: customer | dealer | supplier | admin.
// ---------------------------------------------------------------------------
import { config } from "../config";
import { products } from "../data/products";
import { company } from "../data/site";

const wait = (value, ms = 80) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

async function http(path, { method = "GET", body } = {}) {
  const res = await fetch(config.apiBase + path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      data.error || data.message || `Request failed (${res.status})`,
    );
  return data;
}

/* ---------------- Catalogue ---------------- */
export const productsApi = {
  list: () => (config.useApi ? http("/api/products") : wait(products)),
  bySlug: async (slug) => {
    if (config.useApi) return http(`/api/products/${slug}`);
    const p = products.find((x) => x.slug === slug);
    if (!p) throw new Error("Product not found");
    return wait(p);
  },
};

/* ---------------- Auth ---------------- */
const SESSION_KEY = "jfm_demo_session";
export const STATIC_AUTH_MESSAGE =
  "Online accounts and ordering open shortly. Until then, please send your order or enquiry by email or WhatsApp and we will respond quickly.";

export const authApi = {
  me: async () => {
    if (config.useApi)
      return http("/api/auth/me")
        .then((r) => r.user)
        .catch(() => null);
    if (!config.demoAuth) return null;
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  },
  login: async ({ email, password, role = "customer" }) => {
    if (config.useApi)
      return http("/api/auth/login", {
        method: "POST",
        body: { email, password },
      }).then((r) => r.user);
    if (!config.demoAuth) throw new Error(STATIC_AUTH_MESSAGE);
    const user = {
      id: "demo",
      name: email.split("@")[0] || "Demo user",
      email,
      role,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return wait(user);
  },
  register: async (data) => {
    if (config.useApi)
      return http("/api/auth/register", { method: "POST", body: data }).then(
        (r) => r.user,
      );
    if (!config.demoAuth) throw new Error(STATIC_AUTH_MESSAGE);
    const user = {
      id: "demo",
      name: data.name,
      email: data.email,
      role: data.role || "customer",
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return wait(user);
  },
  logout: async () => {
    if (config.useApi) return http("/api/auth/logout", { method: "POST" });
    localStorage.removeItem(SESSION_KEY);
    return wait(true, 0);
  },
};

/* ---------------- Cart / orders ---------------- */
export const ordersApi = {
  place: async (order) => {
    if (config.useApi)
      return http("/api/orders", { method: "POST", body: order });
    throw new Error("Online checkout opens with the next release.");
  },
  verify: (id, payload) =>
    http(`/api/orders/${id}/verify`, { method: "POST", body: payload }),
  mockPay: (id) => http(`/api/orders/${id}/mock-pay`, { method: "POST" }),
  mine: () => http("/api/orders"),
};

/* ---------------- Forms (contact, dealer enquiry, supplier registration, career) ---------------- */
// Static mode: opens the visitor's email app pre-filled, so the form really works without a backend.
export const formsApi = {
  submit: async (kind, subject, fields) => {
    if (config.useApi)
      return http(`/api/forms/${kind}`, { method: "POST", body: fields });
    const body = Object.entries(fields)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    const url = `mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    return { mode: "mailto" };
  },
};

/* ---------------- Admin ---------------- */
export const adminApi = {
  stats: () => http("/api/admin/stats"),
  orders: ({ status = "", q = "", page = 1 } = {}) =>
    http(`/api/admin/orders?${new URLSearchParams({ status, q, page })}`),
  order: (id) => http(`/api/admin/orders/${id}`),
  setStatus: (id, status) =>
    http(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
  products: () => http("/api/admin/products"),
  updateProduct: (id, body) =>
    http(`/api/admin/products/${id}`, { method: "PATCH", body }),
  updatePack: (id, body) =>
    http(`/api/admin/packs/${id}`, { method: "PATCH", body }),
  customers: () => http("/api/admin/customers"),
  setCustomerActive: (id, is_active) =>
    http(`/api/admin/customers/${id}`, {
      method: "PATCH",
      body: { is_active },
    }),
  brands: () => http("/api/admin/master/brands"),
  saveBrand: (id, body) =>
    id
      ? http(`/api/admin/master/brands/${id}`, { method: "PATCH", body })
      : http("/api/admin/master/brands", { method: "POST", body }),
  deleteBrand: (id) =>
    http(`/api/admin/master/brands/${id}`, { method: "DELETE" }),
  categories: () => http("/api/admin/master/categories"),
  saveCategory: (id, body) =>
    id
      ? http(`/api/admin/master/categories/${id}`, { method: "PATCH", body })
      : http("/api/admin/master/categories", { method: "POST", body }),
  deleteCategory: (id) =>
    http(`/api/admin/master/categories/${id}`, { method: "DELETE" }),
  catalogOptions: () => 
	http("/api/admin/catalog/options"),
  catalogProducts: () => 
	http("/api/admin/catalog/products"),
  createProduct: (body) =>
    http("/api/admin/catalog/products", { method: "POST", body }),
  saveProduct: (id, body) =>
    http(`/api/admin/catalog/products/${id}`, { method: "PATCH", body }),
  addPack: (id, body) =>
    http(`/api/admin/catalog/products/${id}/packs`, { method: "POST", body }),
  deletePack: (id) =>
    http(`/api/admin/catalog/packs/${id}`, { method: "DELETE" }),
};
