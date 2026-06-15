// Thin fetch wrapper for the Zest Home backend.
//
// All requests include credentials so HTTP-only cookies travel. For
// state-changing requests we read the `csrf` cookie (set by GET
// /api/auth/csrf) and forward it as the x-csrf-token header.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

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

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export const api = async <T = unknown>(path: string, options: RequestOptions = {}): Promise<T> => {
  const method = (options.method ?? "GET").toUpperCase();
  const needsCsrf = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (needsCsrf) await primeCsrf();

  const headers = new Headers(options.headers);
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }
  if (needsCsrf) {
    const token = readCookie("csrf");
    if (token) headers.set("x-csrf-token", token);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      method,
      headers,
      credentials: "include",
      body:
        options.body === undefined
          ? undefined
          : options.body instanceof FormData
            ? options.body
            : JSON.stringify(options.body),
    });
  } catch (err) {
    throw new ApiError("Network error", {
      status: 0,
      code: "network_error",
      details: err instanceof Error ? err.message : String(err),
    });
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
  verifyEmail: (token: string) =>
    api<{ user: PublicUser }>("/api/auth/verify-email", { method: "POST", body: { token } }),
  resendVerification: () =>
    api<{ ok: true }>("/api/auth/resend-verification", { method: "POST" }),
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

export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
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
  items: { productId: string; quantity: number }[];
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
  user: { email: string; name: string };
}

export interface StockRow {
  productId: string;
  name: string | null;
  stock: number;
  updatedAt: string;
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
    api<{ order: Order }>(`/api/admin/orders/${encodeURIComponent(id)}`),
  updateOrderStatus: (id: string, status: OrderStatus) =>
    api<{ order: Order }>(`/api/admin/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { status },
    }),
  listStock: () => api<{ stock: StockRow[] }>("/api/admin/stock"),
  setStock: (productId: string, stock: number) =>
    api<{ productId: string; stock: number }>(
      `/api/admin/stock/${encodeURIComponent(productId)}`,
      { method: "PATCH", body: { stock } },
    ),
};

// ── Public catalog ────────────────────────────────────────────────────
export const catalogApi = {
  // Live stock { productId: stock } so the storefront reflects real levels.
  stock: () => api<{ stock: Record<string, number> }>("/api/catalog/stock"),
};
