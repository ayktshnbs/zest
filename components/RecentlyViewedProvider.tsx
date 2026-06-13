"use client";

import React, {
  createContext,
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

  const value = useMemo<RecentlyViewedContextType>(
    () => ({
      ids,
      track: (id: string) =>
        setIds((prev) => {
          const filtered = prev.filter((x) => x !== id);
          return [id, ...filtered].slice(0, MAX_ITEMS);
        }),
      clear: () => setIds([]),
      isHydrated,
    }),
    [ids, isHydrated],
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
