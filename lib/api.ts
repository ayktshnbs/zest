// Thin fetch wrapper for the Zest Home backend.
//
// All requests include credentials so HTTP-only cookies travel. For
// state-changing requests we read the `csrf` cookie (set by GET
// /api/auth/csrf) and forward it as the x-csrf-token header.

// In production the Next app proxies /api/* to the backend (see next.config.mjs
// rewrites), so the browser uses relative same-origin paths ("" base). Locally
// it talks to the Express dev server directly. An explicit NEXT_PUBLIC_API_URL
// overrides both.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000");

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, opts: { status: number; code?: string; details?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

const readCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp("(?:^|;\\s*)" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
};

let csrfPrimed = false;
const primeCsrf = async () => {
  if (csrfPrimed || readCookie("csrf")) {
    csrfPrimed = true;
    return;
  }
  try {
    await fetch(`${API_BASE}/api/auth/csrf`, { credentials: "include" });
    csrfPrimed = true;
  } catch {
    // best effort — caller will hit the real error path on the next request
  }
};

// JWT access cookie lives 15 min; the long-lived refresh_token cookie can mint
// a fresh one. Without this, every admin save after sitting on the page for a
// quarter hour fails with "Authentication required". Coalesce concurrent 401s
// so a flurry of failed requests trigger one refresh, not N.
let refreshInflight: Promise<boolean> | null = null;
const tryRefreshSession = async (): Promise<boolean> => {
  if (refreshInflight) return refreshInflight;
  refreshInflight = (async () => {
    try {
      const token = readCookie("csrf");
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: token ? { "x-csrf-token": token } : undefined,
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      // Allow the next 401 (after some user action later) to refresh again.
      setTimeout(() => { refreshInflight = null; }, 0);
    }
  })();
  return refreshInflight;
};

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export const api = async <T = unknown>(
  path: string,
  options: RequestOptions = {},
  _retried = false,
): Promise<T> => {
  const method = (options.method ?? "GET").toUpperCase();
  const needsCsrf = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (needsCsrf) await primeCsrf();

  const buildHeaders = () => {
    const h = new Headers(options.headers);
    if (options.body !== undefined && !(options.body instanceof FormData)) {
      h.set("content-type", "application/json");
    }
    if (needsCsrf) {
      const token = readCookie("csrf");
      if (token) h.set("x-csrf-token", token);
    }
    return h;
  };

  const sendRequest = (): Promise<Response> =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      method,
      headers: buildHeaders(),
      credentials: "include",
      body:
        options.body === undefined
          ? undefined
          : options.body instanceof FormData
            ? options.body
            : JSON.stringify(options.body),
    });

  let res: Response;
  try {
    res = await sendRequest();
  } catch (err) {
    throw new ApiError("Network error", {
      status: 0,
      code: "network_error",
      details: err instanceof Error ? err.message : String(err),
    });
  }

  // Access cookie expired mid-session → try a single silent refresh and replay
  // the same request. Skip if we just refreshed, or if this IS the refresh
  // call, to avoid loops.
  if (res.status === 401 && !_retried && !path.startsWith("/api/auth/")) {
    const ok = await tryRefreshSession();
    if (ok) return api<T>(path, options, true);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const err = typeof payload === "object" && payload && "error" in payload
      ? (payload as { error: { code?: string; message?: string; details?: unknown } }).error
      : undefined;
    throw new ApiError(err?.message || `Request failed (${res.status})`, {
      status: res.status,
      code: err?.code,
      details: err?.details,
    });
  }

  return payload as T;
};

// ── Typed helpers ─────────────────────────────────────────────────────
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
  emailVerified: boolean;
  hasGoogle: boolean;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  me: () => api<{ user: PublicUser }>("/api/users/me"),
  login: (body: { email: string; password: string }) =>
    api<{ user: PublicUser }>("/api/auth/login", { method: "POST", body }),
  register: (body: { name: string; email: string; password: string }) =>
    api<{ user: PublicUser }>("/api/auth/register", { method: "POST", body }),
  logout: () => api<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  forgotPassword: (body: { email: string }) =>
    api<{ ok: true }>("/api/auth/forgot-password", { method: "POST", body }),
  resetPassword: (body: { token: string; password: string }) =>
    api<{ ok: true }>("/api/auth/reset-password", { method: "POST", body }),
  verifyEmail: (token: string) =>
    api<{ user: PublicUser }>("/api/auth/verify-email", { method: "POST", body: { token } }),
  resendVerification: () =>
    api<{ ok: true }>("/api/auth/resend-verification", { method: "POST" }),
  // Sign in with a Google ID token (from Google Identity Services).
  google: (idToken: string) =>
    api<{ user: PublicUser; isNew: boolean }>("/api/auth/google", {
      method: "POST",
      body: { id_token: idToken },
    }),
};

export const favoritesApi = {
  list: () => api<{ productIds: string[] }>("/api/favorites"),
  add: (productId: string) =>
    api<{ ok: true }>("/api/favorites", { method: "POST", body: { productId } }),
  remove: (productId: string) =>
    api<{ ok: true }>(`/api/favorites/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    }),
  merge: (productIds: string[]) =>
    api<{ productIds: string[] }>("/api/favorites/merge", {
      method: "POST",
      body: { productIds },
    }),
};

// ── Orders ────────────────────────────────────────────────────────────
export interface Address {
  fullName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2
}

export interface OrderLineItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";
export type FulfillmentStatus =
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "returned";

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  items: OrderLineItem[];
  shippingAddress: Address;
  billingAddress?: Address | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  currency: string;
  totalCents: number;
  createdAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CreateOrderInput {
  // `colorKey` is required for variant products and ignored for everything else.
  items: { productId: string; quantity: number; colorKey?: string }[];
  shippingAddress: Address;
  billingAddress?: Address;
  notes?: string;
}

export const ordersApi = {
  create: (body: CreateOrderInput) =>
    api<{ order: Order }>("/api/orders", { method: "POST", body }),
  list: (page = 1, pageSize = 20) =>
    api<{ orders: OrderSummary[]; pagination: Pagination }>(
      `/api/orders?page=${page}&pageSize=${pageSize}`,
    ),
  get: (id: string) => api<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}`),
};

// ── Admin ─────────────────────────────────────────────────────────────
export interface AdminOrderSummary extends OrderSummary {
  fulfillmentStatus: FulfillmentStatus;
  items: OrderLineItem[];
  user: { email: string; name: string };
}

export interface StockRow {
  productId: string;
  name: string | null;
  stock: number;
  updatedAt: string;
}

export interface AdminProduct {
  productId: string;
  name: string; // effective (override or default)
  defaultName: string;
  nameOverridden: boolean;
  priceCents: number; // effective
  defaultPriceCents: number;
  priceOverridden: boolean;
  stock: number;
  // Description overrides — null means "use the code default". Defaults aren't
  // returned by the API (they live in lib/products.ts); resolve client-side.
  shortDescriptionOverride: string | null;
  descriptionOverride: string | null;
  // Image override: null means "use static catalog images on disk".
  imageUrlsOverride: string[] | null;
  // Set + badge overrides (parity with custom products).
  volumeLabelOverride: string | null;
  setSizeOverride: number | null;
  badgesOverride: {
    isNew?: boolean;
    isBestSeller?: boolean;
    isFeatured?: boolean;
  } | null;
  // FALSE means the admin retired this built-in (hidden from storefront).
  isActive: boolean;
}

export const adminApi = {
  listOrders: (params: { page?: number; pageSize?: number; status?: OrderStatus } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.pageSize) q.set("pageSize", String(params.pageSize));
    if (params.status) q.set("status", params.status);
    const qs = q.toString();
    return api<{ orders: AdminOrderSummary[]; pagination: Pagination }>(
      `/api/admin/orders${qs ? `?${qs}` : ""}`,
    );
  },
  getOrder: (id: string) =>
    api<{ order: Order; customer: { email: string; name: string } }>(
      `/api/admin/orders/${encodeURIComponent(id)}`,
    ),
  updateOrder: (
    id: string,
    patch: { status?: OrderStatus; fulfillmentStatus?: FulfillmentStatus },
  ) =>
    api<{ order: Order }>(`/api/admin/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: patch,
    }),
  listStock: () => api<{ stock: StockRow[] }>("/api/admin/stock"),
  setStock: (productId: string, stock: number) =>
    api<{ productId: string; stock: number }>(
      `/api/admin/stock/${encodeURIComponent(productId)}`,
      { method: "PATCH", body: { stock } },
    ),
  listProducts: () => api<{ products: AdminProduct[] }>("/api/admin/products"),
  // Pass a field to set it; pass null to clear an override (revert to default).
  updateProduct: (
    productId: string,
    patch: {
      name?: string | null;
      priceCents?: number | null;
      stock?: number;
      shortDescription?: string | null;
      description?: string | null;
      // null or empty clears the image override → static photos take over.
      imageUrls?: string[] | null;
      // Replace-all semantics. Pass [] to remove all variants.
      variants?: {
        colorKey: string;
        colorLabel: string;
        colorHex: string;
        stock?: number;
        imageUrls?: string[];
      }[];
      // Parity with custom products — null clears the override.
      volumeLabel?: string | null;
      setSize?: number | null;
      badges?: {
        isNew?: boolean;
        isBestSeller?: boolean;
        isFeatured?: boolean;
      } | null;
      // Retire / restore a built-in. The seed stays in lib/products.ts; this
      // just hides it from the storefront. There's no hard delete for built-ins.
      isActive?: boolean;
    },
  ) =>
    api<{ product: AdminProduct }>(
      `/api/admin/products/${encodeURIComponent(productId)}`,
      { method: "PATCH", body: patch },
    ),
};

// ── Public catalog ────────────────────────────────────────────────────
export interface CatalogOverride {
  name: string | null;
  priceCents: number | null;
  shortDescription: string | null;
  description: string | null;
  imageUrls: string[] | null;
  volumeLabel: string | null;
  setSize: number | null;
  badges: {
    isNew?: boolean;
    isBestSeller?: boolean;
    isFeatured?: boolean;
  } | null;
}

export interface PublicCategory {
  slug: string;
  label: string;
  imageUrl: string | null;
  displayOrder: number;
}

export interface CustomProductData {
  id: string;
  name: string;
  categorySlug: string;
  priceCents: number;
  shortDescription: string | null;
  description: string | null;
  imageUrls: string[];
  badges: { isNew?: boolean; isBestSeller?: boolean; isFeatured?: boolean };
  isActive: boolean;
  // Set-style products: structural metadata + per-color variants.
  volumeLabel?: string | null;
  setSize?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  colorKey: string;
  colorLabel: string;
  colorHex: string;
  stock: number;
  imageUrls: string[];
  position: number;
}

export const catalogApi = {
  // Live admin-managed data the storefront overlays: stock + name/price/desc
  // overrides + admin-added categories and products + per-product color
  // variants + ids of retired built-in products (storefront hides them).
  catalog: () =>
    api<{
      stock: Record<string, number>;
      overrides: Record<string, CatalogOverride>;
      retiredIds?: string[];
      categories: PublicCategory[];
      customProducts: CustomProductData[];
      variants?: Record<string, ProductVariant[]>;
    }>("/api/catalog/stock"),
};

// ── Admin: categories + custom products + uploads ─────────────────────
export interface AdminCategory extends PublicCategory {}

export const adminCategoriesApi = {
  list: () => api<{ categories: AdminCategory[] }>("/api/admin/categories"),
  create: (body: { slug: string; label: string; imageUrl?: string | null; displayOrder?: number }) =>
    api<{ category: AdminCategory }>("/api/admin/categories", { method: "POST", body }),
  update: (slug: string, body: { label?: string; imageUrl?: string | null; displayOrder?: number }) =>
    api<{ category: AdminCategory }>(
      `/api/admin/categories/${encodeURIComponent(slug)}`,
      { method: "PATCH", body },
    ),
  remove: (slug: string) =>
    api<void>(`/api/admin/categories/${encodeURIComponent(slug)}`, { method: "DELETE" }),
};

export interface CreateCustomProductInput {
  name: string;
  categorySlug: string;
  priceCents: number;
  shortDescription?: string | null;
  description?: string | null;
  imageUrls?: string[];
  badges?: { isNew?: boolean; isBestSeller?: boolean; isFeatured?: boolean };
  isActive?: boolean;
  initialStock?: number;
  volumeLabel?: string | null;
  setSize?: number | null;
  variants?: {
    colorKey: string;
    colorLabel: string;
    colorHex: string;
    stock?: number;
    imageUrls?: string[];
  }[];
}

export const adminCustomProductsApi = {
  list: () => api<{ products: CustomProductData[] }>("/api/admin/custom-products"),
  create: (body: CreateCustomProductInput) =>
    api<{ product: CustomProductData }>("/api/admin/custom-products", {
      method: "POST",
      body,
    }),
  update: (id: string, body: Partial<CreateCustomProductInput>) =>
    api<{ product: CustomProductData }>(
      `/api/admin/custom-products/${encodeURIComponent(id)}`,
      { method: "PATCH", body },
    ),
  remove: (id: string) =>
    api<void>(`/api/admin/custom-products/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
}

export const adminUploadsApi = {
  // Get a signed payload, then POST the file directly to Cloudinary's uploadUrl.
  sign: (type: "products" | "categories") =>
    api<UploadSignature>("/api/admin/uploads/sign", { method: "POST", body: { type } }),
};

// Cloudinary free-tier max upload size — files over this get rejected with
// "File size too large", and on slow networks they often *appear* to "crash"
// because the request just times out silently. Check up front so the admin
// sees a specific message per file.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Upload several files in parallel. Returns the URLs that succeeded plus a
 * per-file error list — a single bad file no longer throws away the rest of
 * the batch, and the real error message reaches the admin.
 */
export const batchUploadImages = async (
  files: File[],
  type: "products" | "categories",
): Promise<{ urls: string[]; errors: string[] }> => {
  const errors: string[] = [];
  const eligible: File[] = [];
  for (const f of files) {
    if (f.size > MAX_UPLOAD_BYTES) {
      const mb = (f.size / (1024 * 1024)).toFixed(1);
      errors.push(`${f.name}: ${mb}MB — en fazla 10MB`);
    } else {
      eligible.push(f);
    }
  }
  const results = await Promise.allSettled(eligible.map((f) => uploadImage(f, type)));
  const urls: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      urls.push(r.value.secureUrl);
    } else {
      const msg =
        r.reason instanceof Error ? r.reason.message : String(r.reason ?? "yüklenemedi");
      errors.push(`${eligible[i].name}: ${msg.slice(0, 140)}`);
    }
  });
  return { urls, errors };
};

/** Upload one file to Cloudinary using a signed payload from the API. */
export const uploadImage = async (
  file: File,
  type: "products" | "categories",
): Promise<{ secureUrl: string; publicId: string }> => {
  const sig = await adminUploadsApi.sign(type);
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);
  const res = await fetch(sig.uploadUrl, { method: "POST", body: form });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Upload failed: ${res.status} ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  return { secureUrl: data.secure_url, publicId: data.public_id };
};
