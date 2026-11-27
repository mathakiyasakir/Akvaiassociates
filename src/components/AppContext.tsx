"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_SITE_CONFIG } from "@/lib/default-data";
import type { OrderItem, PublicUser, SiteConfig } from "@/lib/types";

export type AppTab = "home" | "service" | "orders" | "profile";

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
  setSession: (user: PublicUser, token: string) => void;
  clearLoginIntent: () => void;
  logout: () => void;
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
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loginIntentToken, setLoginIntentToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [pendingTab, setPendingTab] = useState<AppTab | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

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
      const res = await fetch("/api/site-config", { cache: "no-store" });
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
      const res = await fetch("/api/auth/status", { headers, cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as {
          authenticated?: boolean;
          user?: PublicUser | null;
        };
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else if (currentToken) {
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

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setLoginIntentToken(null);
    setOrders([]);
    setPendingTab(null);
    setActiveTab("home");
    void checkAuthStatus(null);
  }, [checkAuthStatus]);

  const authFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      const res = await fetch(input, { ...init, headers, cache: "no-store" });
      if (res.status === 401) {
        logout();
      }
      return res;
    },
    [token, logout]
  );

  const refreshOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await authFetch("/api/orders");
      if (res.ok) {
        const data = (await res.json()) as { orders?: OrderItem[] };
        if (Array.isArray(data.orders)) setOrders(data.orders);
      }
    } catch {
      // Keep existing orders
    }
  }, [token, authFetch]);

  useEffect(() => {
    if (!token || !user) return;
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
  }, [token, user, loadPublicSiteConfig, refreshOrders]);

  const setSession = useCallback(
    (nextUser: PublicUser, nextToken: string) => {
      setUser(nextUser);
      setToken(nextToken);
      setLoginIntentToken(null);
      if (pendingTab) {
        setActiveTab(pendingTab);
        setPendingTab(null);
      } else {
        setActiveTab("home");
      }
    },
    [pendingTab]
  );

  const openGatedLogin = useCallback(
    async (afterLoginTab?: AppTab) => {
      if (afterLoginTab) {
        setPendingTab(afterLoginTab);
      }
      try {
        const res = await fetch("/api/auth/login-intent", {
          method: "POST",
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
    [router]
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
