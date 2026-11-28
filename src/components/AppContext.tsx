"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { DEFAULT_SITE_CONFIG } from "@/lib/default-data";
import type { OrderItem, PublicUser, SiteConfig } from "@/lib/types";

export type AppTab = "home" | "service" | "orders" | "profile";

export const TAB_PATHS: Record<AppTab, string> = {
  home: "/",
  service: "/services",
  orders: "/orders",
  profile: "/profile",
};

function pathnameToTab(pathname: string | null): AppTab {
  if (!pathname) return "home";
  if (pathname.startsWith("/services")) return "service";
  if (pathname.startsWith("/orders")) return "orders";
  if (pathname.startsWith("/profile")) return "profile";
  return "home";
}

interface AppContextValue {
  user: PublicUser | null;
  token: string | null;
  loginIntentToken: string | null;
  authReady: boolean;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  siteConfig: SiteConfig;
  orders: OrderItem[];
  loadingData: boolean;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
  setSession: (user: PublicUser, token: string) => string;
  clearLoginIntent: () => void;
  logout: () => Promise<void>;
  requireLoginOrRun: (action: () => void, afterLoginTab?: AppTab) => boolean;
  refreshSiteConfig: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  setSiteConfigLocal: (config: SiteConfig) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const BLOCKED_AUTH_HASHES = new Set([
  "#login",
  "#signin",
  "#sign-in",
  "#signup",
  "#sign-up",
  "#register",
  "#auth",
  "#admin",
  "#portal",
]);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loginIntentToken, setLoginIntentToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const activeTab = useMemo(() => pathnameToTab(pathname), [pathname]);

  const setActiveTab = useCallback(
    (tab: AppTab) => {
      const target = TAB_PATHS[tab] || "/";
      if (pathname !== target) {
        router.push(target);
      }
    },
    [pathname, router]
  );

  // Strip direct #login / #admin / #auth URL hash tampering without opening login
  useEffect(() => {
    const scrubBlockedHash = () => {
      const currentHash = window.location.hash.trim().toLowerCase();
      if (BLOCKED_AUTH_HASHES.has(currentHash)) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      }
    };
    scrubBlockedHash();
    window.addEventListener("hashchange", scrubBlockedHash);
    return () => window.removeEventListener("hashchange", scrubBlockedHash);
  }, []);

  const loadPublicSiteConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/site-config", {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as { config?: SiteConfig };
        if (data.config) setSiteConfig(data.config);
      }
    } catch {
      // Keep default site config on transient error
    }
  }, []);

  const checkAuthStatus = useCallback(async (currentToken: string | null) => {
    try {
      const headers: HeadersInit = currentToken
        ? { Authorization: `Bearer ${currentToken}` }
        : {};
      const res = await fetch("/api/auth/status", {
        headers,
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as {
          authenticated?: boolean;
          user?: PublicUser | null;
        };
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
          setToken(null);
        }
      }
    } catch {
      // Keep state on transient network failure
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadPublicSiteConfig(), checkAuthStatus(null)]);
  }, [loadPublicSiteConfig, checkAuthStatus]);

  const clearLoginIntent = useCallback(() => {
    setLoginIntentToken(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // Continue clearing client state even on transient network error
    }
    setUser(null);
    setToken(null);
    setLoginIntentToken(null);
    setOrders([]);
    setPendingPath(null);
    if (pathname && !pathname.startsWith("/portal/")) {
      router.push("/");
    }
  }, [pathname, router]);

  const authFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      const res = await fetch(input, {
        ...init,
        headers,
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        setUser(null);
        setToken(null);
        setOrders([]);
      }
      return res;
    },
    [token]
  );

  const refreshOrders = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch("/api/orders");
      if (res.ok) {
        const data = (await res.json()) as { orders?: OrderItem[] };
        if (Array.isArray(data.orders)) setOrders(data.orders);
      }
    } catch {
      // Keep existing orders
    }
  }, [user, authFetch]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const loadAuthedData = async () => {
      setLoadingData(true);
      await Promise.all([loadPublicSiteConfig(), refreshOrders()]);
      if (!cancelled) setLoadingData(false);
    };
    void loadAuthedData();
    return () => {
      cancelled = true;
    };
  }, [user, loadPublicSiteConfig, refreshOrders]);

  const setSession = useCallback(
    (nextUser: PublicUser, nextToken: string): string => {
      setUser(nextUser);
      setToken(nextToken);
      setLoginIntentToken(null);
      const dest = pendingPath || "/";
      setPendingPath(null);
      return dest;
    },
    [pendingPath]
  );

  const openGatedLogin = useCallback(
    async (afterLoginTab?: AppTab) => {
      const nextDestination = afterLoginTab
        ? TAB_PATHS[afterLoginTab]
        : pathname && pathname !== "/login"
        ? pathname
        : "/";
      setPendingPath(nextDestination);
      try {
        const res = await fetch("/api/auth/login-intent", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { intentToken?: string };
        if (data.intentToken) {
          setLoginIntentToken(data.intentToken);
          router.push("/login");
        }
      } catch {
        // Stay safely on current page if intent cannot be issued
      }
    },
    [pathname, router]
  );

  const requireLoginOrRun = useCallback(
    (action: () => void, afterLoginTab?: AppTab): boolean => {
      if (!user) {
        void openGatedLogin(afterLoginTab);
        return false;
      }
      action();
      return true;
    },
    [user, openGatedLogin]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        loginIntentToken,
        authReady,
        activeTab,
        setActiveTab,
        siteConfig,
        orders,
        loadingData,
        authFetch,
        setSession,
        clearLoginIntent,
        logout,
        requireLoginOrRun,
        refreshSiteConfig: loadPublicSiteConfig,
        refreshOrders,
        setSiteConfigLocal: setSiteConfig,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return ctx;
}
