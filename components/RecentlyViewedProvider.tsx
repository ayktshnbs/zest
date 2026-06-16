"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from "react";

interface RecentlyViewedContextType {
  ids: string[];
  track: (id: string) => void;
  clear: () => void;
  isHydrated: boolean;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "zest:recently-viewed";
const MAX_ITEMS = 8;

export const RecentlyViewedProvider = ({ children }: { children: ReactNode }) => {
  const [ids, setIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed))
          setIds(parsed.filter((x) => typeof x === "string"));
      }
    } catch {}
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {}
  }, [ids, isHydrated]);

  // Clear on logout so browsing history doesn't persist to the next user on a
  // shared device.
  useEffect(() => {
    const onLogout = () => {
      setIds([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    };
    window.addEventListener("zest:logout", onLogout);
    return () => window.removeEventListener("zest:logout", onLogout);
  }, []);

  // Stable identities so a consumer's effect — e.g. the product page's
  // useEffect(() => track(id), [product, track]) — doesn't re-fire every render.
  // Recreating these each render is what caused the infinite update loop
  // ("Maximum update depth exceeded"). track is also a no-op when the id is
  // already the most-recent, so it never triggers a needless state update.
  const track = useCallback((id: string) => {
    setIds((prev) => {
      if (prev[0] === id) return prev;
      const filtered = prev.filter((x) => x !== id);
      return [id, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo<RecentlyViewedContextType>(
    () => ({ ids, track, clear, isHydrated }),
    [ids, track, clear, isHydrated],
  );

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = () => {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx)
    throw new Error(
      "useRecentlyViewed must be used within a RecentlyViewedProvider",
    );
  return ctx;
};
