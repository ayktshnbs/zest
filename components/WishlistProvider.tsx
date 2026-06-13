"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { favoritesApi, ApiError } from "@/lib/api";
import { useAuth } from "./AuthProvider";

interface WishlistContextType {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  isHydrated: boolean;
  isSyncing: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "zest:wishlist";

const readLocal = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
};

const writeLocal = (ids: string[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* quota / private mode — ignore */
  }
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: authLoading } = useAuth();

  const [ids, setIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Track which user we last synced to so we only run the merge once per
  // login transition (logged-out → logged-in). Logout resets it.
  const syncedUserId = useRef<string | null>(null);

  // 1) Initial hydrate from localStorage
  useEffect(() => {
    setIds(readLocal());
    setIsHydrated(true);
  }, []);

  // 2) Mirror to localStorage on change — useful both as cache for the
  //    logged-in user and as the source-of-truth for anonymous users.
  useEffect(() => {
    if (!isHydrated) return;
    writeLocal(ids);
  }, [ids, isHydrated]);

  // 3) On login: merge local with server, then keep server as source of truth.
  //    On logout: forget the sync marker so a future login re-syncs.
  useEffect(() => {
    if (authLoading || !isHydrated) return;

    if (!user) {
      syncedUserId.current = null;
      return;
    }
    if (syncedUserId.current === user.id) return;

    let cancelled = false;
    (async () => {
      setIsSyncing(true);
      try {
        const local = readLocal();
        const result = local.length > 0
          ? await favoritesApi.merge(local)
          : await favoritesApi.list();
        if (cancelled) return;
        setIds(result.productIds);
        syncedUserId.current = user.id;
      } catch (err) {
        // If the API is unreachable, silently fall back to local — better UX
        // than spamming errors. Will retry next time the provider mounts.
        if (!(err instanceof ApiError) || err.status >= 500 || err.status === 0) {
          // eslint-disable-next-line no-console
          console.warn("[wishlist] sync failed, staying on local copy:", err);
        }
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, isHydrated]);

  // On logout, drop the in-memory list and the local cache so the next user on
  // a shared device starts clean — and we never merge user A's wishlist into
  // user B's account on the subsequent login.
  useEffect(() => {
    const onLogout = () => {
      syncedUserId.current = null;
      setIds([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    };
    window.addEventListener("zest:logout", onLogout);
    return () => window.removeEventListener("zest:logout", onLogout);
  }, []);

  // ── Mutations ───────────────────────────────────────────────────────
  // Always update local state optimistically. If logged in, fire-and-forget
  // the API call — failures roll back the optimistic change.
  const persistAdd = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await favoritesApi.add(id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[wishlist] add failed:", err);
      setIds((prev) => prev.filter((x) => x !== id));
    }
  }, [user]);

  const persistRemove = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await favoritesApi.remove(id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[wishlist] remove failed:", err);
      setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  }, [user]);

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) => {
        if (prev.includes(id)) {
          void persistRemove(id);
          return prev.filter((x) => x !== id);
        }
        void persistAdd(id);
        return [...prev, id];
      });
    },
    [persistAdd, persistRemove],
  );

  const remove = useCallback(
    (id: string) => {
      setIds((prev) => prev.filter((x) => x !== id));
      void persistRemove(id);
    },
    [persistRemove],
  );

  const clear = useCallback(() => {
    setIds((prev) => {
      if (user) {
        prev.forEach((id) => {
          void persistRemove(id);
        });
      }
      return [];
    });
  }, [user, persistRemove]);

  const value = useMemo<WishlistContextType>(
    () => ({
      ids,
      has: (id: string) => ids.includes(id),
      toggle,
      remove,
      clear,
      count: ids.length,
      isHydrated,
      isSyncing,
    }),
    [ids, toggle, remove, clear, isHydrated, isSyncing],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
};
