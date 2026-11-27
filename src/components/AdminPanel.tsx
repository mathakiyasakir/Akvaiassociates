"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Database,
  Eye,
  EyeOff,
  Image as ImageIcon,
  KeyRound,
  Layers,
  LayoutDashboard,
  Link2,
  Loader2,
  PlugZap,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Type,
  Unplug,
  Users,
} from "lucide-react";
import { useApp } from "@/components/AppContext";
import type {
  MongoStatus,
  OrderItem,
  OrderStatus,
  PortalSecurityStatus,
  PublicUser,
  ServiceIconKey,
  ServiceItem,
  ShowcaseItem,
  SiteConfig,
  UserRole,
} from "@/lib/types";

type AdminSection =
  | "overview"
  | "hero"
  | "services"
  | "showcase"
  | "orders"
  | "users"
  | "mongodb"
  | "security";

const ADMIN_TABS: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "hero", label: "Hero & Brand", icon: Type },
  { id: "services", label: "Services", icon: Layers },
  { id: "showcase", label: "Showcase & Story", icon: ImageIcon },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "users", label: "Users", icon: Users },
  { id: "mongodb", label: "MongoDB", icon: Database },
  { id: "security", label: "Secret URL", icon: KeyRound },
];

const ICON_OPTIONS: { value: ServiceIconKey; label: string }[] = [
  { value: "building", label: "Architecture Building" },
  { value: "grid", label: "Interior Grid" },
  { value: "ruler", label: "Planning Ruler" },
  { value: "box", label: "3D Box" },
  { value: "compass", label: "Compass" },
  { value: "layers", label: "Layers" },
  { value: "pentool", label: "Drafting Pen" },
  { value: "home", label: "Residence Home" },
];

const ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "In Review",
  "In Progress",
  "Completed",
  "Cancelled",
];

interface AdminPanelProps {
  portalKey: string;
}

export function AdminPanel({ portalKey }: AdminPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const { user, siteConfig, authFetch, setSiteConfigLocal, refreshOrders } = useApp();

  const [section, setSection] = useState<AdminSection>("overview");
  const [draft, setDraft] = useState<SiteConfig>(() => structuredClone(siteConfig));
  const [savingConfig, setSavingConfig] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  // Admin Orders state
  const [allOrders, setAllOrders] = useState<OrderItem[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>("All");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Admin Users state
  const [users, setUsers] = useState<PublicUser[]>([]);

  // MongoDB Control state
  const [mongoStatus, setMongoStatus] = useState<MongoStatus | null>(null);
  const [mongoMode, setMongoMode] = useState<"cluster" | "uri">("cluster");
  const [clusterId, setClusterId] = useState("");
  const [mongoUser, setMongoUser] = useState("");
  const [mongoPass, setMongoPass] = useState("");
  const [showMongoPass, setShowMongoPass] = useState(false);
  const [mongoUri, setMongoUri] = useState("");
  const [mongoDbName, setMongoDbName] = useState("akvai_associates");
  const [connectingMongo, setConnectingMongo] = useState(false);

  // Dynamic Secret URL & Password state
  const [security, setSecurity] = useState<PortalSecurityStatus | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [rotatingSlug, setRotatingSlug] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updatingPass, setUpdatingPass] = useState(false);

  const adminFetch = useCallback(
    (url: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      headers.set("x-admin-portal-key", portalKey);
      return authFetch(url, { ...init, headers });
    },
    [authFetch, portalKey]
  );

  const notify = useCallback((type: "ok" | "err", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => {
      setToast((current) => (current?.text === text ? null : current));
    }, 3800);
  }, []);

  useEffect(() => {
    setDraft(structuredClone(siteConfig));
  }, [siteConfig]);

  const loadAdminData = useCallback(async () => {
    try {
      const [ordersRes, usersRes, mongoRes, secRes] = await Promise.all([
        adminFetch("/api/orders?scope=all"),
        adminFetch("/api/admin/users"),
        adminFetch("/api/admin/mongodb"),
        adminFetch("/api/admin/portal-security"),
      ]);
      if (ordersRes.ok) {
        const d = (await ordersRes.json()) as { orders?: OrderItem[] };
        if (Array.isArray(d.orders)) setAllOrders(d.orders);
      }
      if (usersRes.ok) {
        const d = (await usersRes.json()) as { users?: PublicUser[] };
        if (Array.isArray(d.users)) setUsers(d.users);
      }
      if (mongoRes.ok) {
        const d = (await mongoRes.json()) as { status?: MongoStatus };
        if (d.status) {
          setMongoStatus(d.status);
          if (d.status.dbName) setMongoDbName(d.status.dbName);
        }
      }
      if (secRes.ok) {
        const d = (await secRes.json()) as { security?: PortalSecurityStatus };
        if (d.security) {
          setSecurity(d.security);
          setNewSlug(d.security.activeSlug);
        }
      }
    } catch {
      notify("err", "Failed to load admin records.");
    }
  }, [adminFetch, notify]);

  useEffect(() => {
    if (user?.role === "admin") {
      void loadAdminData();
    }
  }, [user?.role, loadAdminData]);

  if (!user || user.role !== "admin") return null;

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await adminFetch("/api/site-config", {
        method: "PUT",
        body: JSON.stringify({ config: draft }),
      });
      const data = (await res.json()) as { config?: SiteConfig; error?: string };
      if (!res.ok || !data.config) {
        notify("err", data.error || "Failed to save website changes.");
        return;
      }
      setSiteConfigLocal(data.config);
      setDraft(structuredClone(data.config));
      notify("ok", "Website settings saved and published live.");
    } catch {
      notify("err", "Network error while saving configuration.");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddService = () => {
    const nextNum = String(draft.services.length + 1).padStart(2, "0");
    const newItem: ServiceItem = {
      id: `service-${Date.now()}`,
      number: `${nextNum} /`,
      title: "New Architectural Service",
      description: "Describe the scope and value of this service.",
      timeline: "4–8 weeks",
      deliverables: ["Initial consultation", "Concept & technical drawings"],
      icon: "compass",
      enabled: true,
    };
    setDraft((prev) => ({ ...prev, services: [...prev.services, newItem] }));
  };

  const handleAddShowcase = () => {
    const newItem: ShowcaseItem = {
      id: `showcase-${Date.now()}`,
      category: "ARCHITECTURAL STUDY",
      title: "New Design Perspective",
      imagePreset: "residential",
      alt: "Architectural design reference",
      studyNote: "Describe the spatial proportion, materials, and lighting.",
      focusAreas: "Proportion · Materiality · Light",
    };
    setDraft((prev) => ({ ...prev, showcase: [...prev.showcase, newItem] }));
  };

  const handleUpdateOrder = async (
    orderId: string,
    status: OrderStatus,
    adminNote: string
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await adminFetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, adminNote }),
        }
      );
      const data = (await res.json()) as { order?: OrderItem; error?: string };
      if (!res.ok || !data.order) {
        notify("err", data.error || "Could not update order.");
        return;
      }
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? data.order! : o))
      );
      await refreshOrders();
      notify("ok", `Order ${orderId} updated to ${status}.`);
    } catch {
      notify("err", "Network error updating order.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await adminFetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setAllOrders((prev) => prev.filter((o) => o.id !== orderId));
        await refreshOrders();
        notify("ok", `Order ${orderId} removed.`);
      }
    } catch {
      notify("err", "Could not remove order.");
    }
  };

  const handleRoleToggle = async (target: PublicUser, nextRole: UserRole) => {
    try {
      const res = await adminFetch("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ userId: target.id, role: nextRole }),
      });
      const data = (await res.json()) as { user?: PublicUser; error?: string };
      if (!res.ok || !data.user) {
        notify("err", data.error || "Could not update role.");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === target.id ? data.user! : u)));
      notify("ok", `${target.name} is now ${nextRole}.`);
    } catch {
      notify("err", "Network error updating role.");
    }
  };

  const handleDeleteUser = async (target: PublicUser) => {
    try {
      const res = await adminFetch(
        `/api/admin/users?userId=${encodeURIComponent(target.id)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        notify("err", data.error || "Could not remove user.");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      notify("ok", `Removed account ${target.email}.`);
    } catch {
      notify("err", "Network error removing user.");
    }
  };

  const handleConnectMongo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConnectingMongo(true);
    try {
      const body =
        mongoMode === "cluster"
          ? {
              mode: "cluster",
              clusterId,
              username: mongoUser,
              password: mongoPass,
              dbName: mongoDbName,
            }
          : {
              mode: "uri",
              uri: mongoUri,
              dbName: mongoDbName,
            };

      const res = await adminFetch("/api/admin/mongodb", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { status?: MongoStatus; error?: string };
      if (!res.ok || !data.status) {
        notify("err", data.error || "Could not connect to MongoDB.");
        return;
      }
      setMongoStatus(data.status);
      setMongoPass("");
      setMongoUri("");
      notify("ok", `Connected live to MongoDB (${data.status.maskedHost})!`);
      await loadAdminData();
    } catch {
      notify("err", "Network error while connecting to MongoDB.");
    } finally {
      setConnectingMongo(false);
    }
  };

  const handleDisconnectMongo = async () => {
    setConnectingMongo(true);
    try {
      const res = await adminFetch("/api/admin/mongodb", { method: "DELETE" });
      const data = (await res.json()) as { status?: MongoStatus };
      if (res.ok && data.status) {
        setMongoStatus(data.status);
        notify("ok", "Disconnected MongoDB. Using local runtime store.");
      }
    } finally {
      setConnectingMongo(false);
    }
  };

  const handleRotateSlug = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRotatingSlug(true);
    try {
      const res = await adminFetch("/api/admin/portal-security", {
        method: "PATCH",
        body: JSON.stringify({
          action: "rotate-slug",
          newSlug: newSlug.trim().toLowerCase(),
        }),
      });
      const data = (await res.json()) as {
        security?: PortalSecurityStatus;
        error?: string;
      };
      if (!res.ok || !data.security) {
        notify("err", data.error || "Could not update secret URL.");
        return;
      }
      setSecurity(data.security);
      notify("ok", `Secret Admin URL updated to ${data.security.portalPath}`);
      router.replace(data.security.portalPath);
    } catch {
      notify("err", "Network error while rotating secret URL.");
    } finally {
      setRotatingSlug(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUpdatingPass(true);
    try {
      const res = await adminFetch("/api/admin/portal-security", {
        method: "PATCH",
        body: JSON.stringify({
          action: "change-password",
          currentPassword,
          newPassword,
        }),
      });
      const data = (await res.json()) as {
        passwordUpdated?: boolean;
        error?: string;
      };
      if (!res.ok || !data.passwordUpdated) {
        notify("err", data.error || "Could not update password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      notify("ok", "Owner password updated successfully.");
    } catch {
      notify("err", "Network error while updating password.");
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleCopyPortalUrl = async () => {
    const path = security?.portalPath || `/portal/${portalKey}`;
    const fullUrl =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 1800);
    } catch {
      notify("err", "Could not copy URL automatically.");
    }
  };

  const filteredOrders =
    orderFilter === "All"
      ? allOrders
      : allOrders.filter((o) => o.status === orderFilter);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 pb-20 lg:py-12">
      <div className="flex flex-col justify-between gap-4 border-b border-[#DDD8CE] pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
            <ShieldCheck className="h-4 w-4" />
            <span>HIDDEN OWNER CONSOLE · /portal/{portalKey}</span>
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#1C1B19]">
            Full Website, Database &amp; Secret URL Control
          </h1>
        </div>

        <motion.button
          type="button"
          onClick={() => void loadAdminData()}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-[3px] border border-[#D4CFC4] bg-white px-4 py-2 text-xs font-medium text-[#1C1B19] hover:bg-[#ECE8DF] sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync All Data</span>
        </motion.button>
      </div>

      {toast && (
        <div
          role="status"
          className={`mt-5 flex items-center gap-2.5 border px-4 py-3 text-sm font-medium ${
            toast.type === "ok"
              ? "border-[#B7D7C9] bg-[#EAF4EF] text-[#0D5C43]"
              : "border-[#E9C4B8] bg-[#FDF2EE] text-[#9A3412]"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Admin Section Tabs */}
      <div className="mt-6 flex flex-wrap gap-1.5 rounded-[4px] border border-[#E2DDD3] bg-white p-1.5">
        {ADMIN_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-[3px] px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${
                active
                  ? "bg-[#0D5C43] text-white"
                  : "text-[#4F4D48] hover:bg-[#F4F1EA] hover:text-[#1C1B19]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {section === "overview" && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-[#E4E0D7] bg-white p-6">
              <p className="text-xs font-medium text-[#6B6963]">Active Services</p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#1C1B19]">
                {draft.services.filter((s) => s.enabled).length}
              </p>
            </div>
            <div className="border border-[#E4E0D7] bg-white p-6">
              <p className="text-xs font-medium text-[#6B6963]">Client Orders</p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#DF7324]">
                {allOrders.length}
              </p>
            </div>
            <div className="border border-[#E4E0D7] bg-white p-6">
              <p className="text-xs font-medium text-[#6B6963]">Registered Users</p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#1C1B19]">
                {users.length}
              </p>
            </div>
            <div className="border border-[#E4E0D7] bg-white p-6">
              <p className="text-xs font-medium text-[#6B6963]">Database Mode</p>
              <p className="mt-2 text-lg font-semibold text-[#0D5C43]">
                {mongoStatus?.connected ? "MongoDB Live" : "Local Store"}
              </p>
              <p className="mt-1 truncate font-mono text-[11px] text-[#75736D]">
                {mongoStatus?.connected
                  ? mongoStatus.maskedHost
                  : "Connect MongoDB anytime"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="border border-[#E4E0D7] bg-white p-6">
              <h2 className="font-serif text-xl font-bold text-[#1C1B19]">
                Hidden Secret Admin URL Active
              </h2>
              <p className="mt-1.5 text-sm text-[#585651]">
                The public client website shows zero admin links and `/admin`
                returns 404. Bookmark or rotate your private URL anytime.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <code className="rounded-[3px] bg-[#F4F1EA] px-3 py-2 font-mono text-xs text-[#0D5C43]">
                  {security?.portalPath || `/portal/${portalKey}`}
                </code>
                <button
                  type="button"
                  onClick={() => void handleCopyPortalUrl()}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-[3px] border border-[#D4CFC4] px-3 py-1.5 text-xs font-medium text-[#1C1B19] hover:bg-[#F4F1EA]"
                >
                  {copiedUrl ? (
                    <Check className="h-3.5 w-3.5 text-[#0D5C43]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedUrl ? "Copied" : "Copy Link"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSection("security")}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-[3px] bg-[#0D5C43] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#094734]"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Change URL / Password</span>
                </button>
              </div>
            </div>

            <div className="border border-[#1F1F1D] bg-[#1F1F1D] p-6 text-white">
              <h2 className="font-serif text-xl font-bold text-white">
                MongoDB Direct Connect
              </h2>
              <p className="mt-1.5 text-sm text-[#BFBDB7]">
                Enter your MongoDB Cluster ID or connection URI to persist all
                website settings, users, orders, and your secret admin URL in
                MongoDB.
              </p>
              <button
                type="button"
                onClick={() => setSection("mongodb")}
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-[3px] bg-[#E07A22] px-4 py-2 text-xs font-semibold text-[#1A1918] hover:bg-[#CF6C18]"
              >
                <Database className="h-4 w-4" />
                <span>Open MongoDB Control</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO & BRAND */}
      {section === "hero" && (
        <div className="mt-8 space-y-6 border border-[#E4E0D7] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ECE8E0] pb-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1C1B19]">
                Hero, Brand &amp; Contact Settings
              </h2>
              <p className="mt-1 text-xs text-[#6B6963]">
                Every text element on the Hero, 3D plaque, and Footer updates
                immediately on save.
              </p>
            </div>
            <motion.button
              type="button"
              disabled={savingConfig}
              onClick={handleSaveConfig}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className="inline-flex min-h-10 items-center gap-2 rounded-[3px] bg-[#0D5C43] px-5 py-2 text-sm font-medium text-white hover:bg-[#094734] disabled:opacity-60"
            >
              {savingConfig ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save Changes</span>
            </motion.button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#3C3B37]">
                Hero Kicker Left
              </label>
              <input
                type="text"
                value={draft.hero.kickerLeft}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    hero: { ...p.hero, kickerLeft: e.target.value },
                  }))
                }
                className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3C3B37]">
                Hero Kicker Right
              </label>
              <input
                type="text"
                value={draft.hero.kickerRight}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    hero: { ...p.hero, kickerRight: e.target.value },
                  }))
                }
                className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#3C3B37]">
                Hero Main Headline
              </label>
              <input
                type="text"
                value={draft.hero.headline}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    hero: { ...p.hero, headline: e.target.value },
                  }))
                }
                className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#3C3B37]">
                Hero Subheading
              </label>
              <textarea
                rows={2}
                value={draft.hero.subheading}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    hero: { ...p.hero, subheading: e.target.value },
                  }))
                }
                className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3C3B37]">
                Primary Button Text
              </label>
              <input
                type="text"
                value={draft.hero.primaryCta}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    hero: { ...p.hero, primaryCta: e.target.value },
                  }))
                }
                className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3C3B37]">
                Secondary Button Text
              </label>
              <input
                type="text"
                value={draft.hero.secondaryCta}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    hero: { ...p.hero, secondaryCta: e.target.value },
                  }))
                }
                className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#3C3B37]">
                Hero Footnote Line
              </label>
              <input
                type="text"
                value={draft.hero.footnote}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    hero: { ...p.hero, footnote: e.target.value },
                  }))
                }
                className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 md:col-span-2">
              <div>
                <label className="block text-xs font-semibold text-[#3C3B37]">
                  3D Plaque Word 1
                </label>
                <input
                  type="text"
                  value={draft.hero.modelMottoLeft}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      hero: { ...p.hero, modelMottoLeft: e.target.value },
                    }))
                  }
                  className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3C3B37]">
                  3D Plaque Word 2
                </label>
                <input
                  type="text"
                  value={draft.hero.modelMottoCenter}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      hero: { ...p.hero, modelMottoCenter: e.target.value },
                    }))
                  }
                  className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3C3B37]">
                  3D Plaque Word 3
                </label>
                <input
                  type="text"
                  value={draft.hero.modelMottoRight}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      hero: { ...p.hero, modelMottoRight: e.target.value },
                    }))
                  }
                  className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3C3B37]">
                Business Contact Email
              </label>
              <input
                type="email"
                value={draft.brand.contactEmail}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    brand: { ...p.brand, contactEmail: e.target.value },
                  }))
                }
                className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3C3B37]">
                Footer Brand Tagline
              </label>
              <input
                type="text"
                value={draft.brand.tagline}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    brand: { ...p.brand, tagline: e.target.value },
                  }))
                }
                className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#3C3B37]">
                Footer Copyright Line
              </label>
              <input
                type="text"
                value={draft.brand.copyright}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    brand: { ...p.brand, copyright: e.target.value },
                  }))
                }
                className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* SERVICES CRUD */}
      {section === "services" && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border border-[#E4E0D7] bg-white p-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1C1B19]">
                Manage Architectural Services
              </h2>
              <p className="mt-1 text-xs text-[#6B6963]">
                Add, edit, toggle visibility, or update deliverables across Home
                and Service tabs.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleAddService}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-[3px] border border-[#0D5C43] px-4 py-2 text-xs font-medium text-[#0D5C43] hover:bg-[#E5EFEA]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Service</span>
              </button>
              <button
                type="button"
                disabled={savingConfig}
                onClick={handleSaveConfig}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-[3px] bg-[#0D5C43] px-5 py-2 text-xs font-medium text-white hover:bg-[#094734] disabled:opacity-60"
              >
                {savingConfig ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save Services</span>
              </button>
            </div>
          </div>

          {draft.services.map((service, index) => (
            <div
              key={service.id}
              className="border border-[#E4E0D7] bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0ECE4] pb-4">
                <p className="font-mono text-xs font-semibold text-[#0D5C43]">
                  {service.number} {service.title}
                </p>
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#4F4D48]">
                    <input
                      type="checkbox"
                      checked={service.enabled}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setDraft((p) => ({
                          ...p,
                          services: p.services.map((s, i) =>
                            i === index ? { ...s, enabled } : s
                          ),
                        }));
                      }}
                      className="h-4 w-4 accent-[#0D5C43]"
                    />
                    <span>Visible on site</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        services: p.services.filter((_, i) => i !== index),
                      }))
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-[3px] px-2.5 text-xs font-medium text-[#9A3412] hover:bg-[#FDF2EE]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3C3B37]">
                    Number Label
                  </label>
                  <input
                    type="text"
                    value={service.number}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        services: p.services.map((s, i) =>
                          i === index ? { ...s, number: e.target.value } : s
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C3B37]">
                    Title
                  </label>
                  <input
                    type="text"
                    value={service.title}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        services: p.services.map((s, i) =>
                          i === index ? { ...s, title: e.target.value } : s
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C3B37]">
                    Icon
                  </label>
                  <select
                    value={service.icon}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        services: p.services.map((s, i) =>
                          i === index
                            ? { ...s, icon: e.target.value as ServiceIconKey }
                            : s
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#3C3B37]">
                    Description
                  </label>
                  <input
                    type="text"
                    value={service.description}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        services: p.services.map((s, i) =>
                          i === index ? { ...s, description: e.target.value } : s
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C3B37]">
                    Timeline
                  </label>
                  <input
                    type="text"
                    value={service.timeline}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        services: p.services.map((s, i) =>
                          i === index ? { ...s, timeline: e.target.value } : s
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-[#3C3B37]">
                    Deliverables (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={service.deliverables.join("\n")}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        services: p.services.map((s, i) =>
                          i === index
                            ? { ...s, deliverables: e.target.value.split("\n") }
                            : s
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SHOWCASE & PRACTICE */}
      {section === "showcase" && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border border-[#E4E0D7] bg-white p-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1C1B19]">
                Showcase, Practice &amp; CTA Content
              </h2>
              <p className="mt-1 text-xs text-[#6B6963]">
                Control inspiration cards, Practice narrative, and the dark
                enquiry CTA banner.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleAddShowcase}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-[3px] border border-[#0D5C43] px-4 py-2 text-xs font-medium text-[#0D5C43] hover:bg-[#E5EFEA]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Showcase Card</span>
              </button>
              <button
                type="button"
                disabled={savingConfig}
                onClick={handleSaveConfig}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-[3px] bg-[#0D5C43] px-5 py-2 text-xs font-medium text-white hover:bg-[#094734] disabled:opacity-60"
              >
                {savingConfig ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save Content</span>
              </button>
            </div>
          </div>

          {draft.showcase.map((item, idx) => (
            <div key={item.id} className="border border-[#E4E0D7] bg-white p-6">
              <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-3">
                <p className="text-xs font-semibold text-[#0D5C43]">
                  Showcase Card #{idx + 1}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((p) => ({
                      ...p,
                      showcase: p.showcase.filter((_, i) => i !== idx),
                    }))
                  }
                  className="inline-flex h-8 items-center gap-1 text-xs font-medium text-[#9A3412]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#3C3B37]">
                    Category Label
                  </label>
                  <input
                    type="text"
                    value={item.category}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        showcase: p.showcase.map((sc, i) =>
                          i === idx ? { ...sc, category: e.target.value } : sc
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C3B37]">
                    Card Title
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        showcase: p.showcase.map((sc, i) =>
                          i === idx ? { ...sc, title: e.target.value } : sc
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C3B37]">
                    Image Source
                  </label>
                  <select
                    value={item.imagePreset}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        showcase: p.showcase.map((sc, i) =>
                          i === idx
                            ? {
                                ...sc,
                                imagePreset: e.target.value as ShowcaseItem["imagePreset"],
                              }
                            : sc
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                  >
                    <option value="residential">Built-in Residential Photo</option>
                    <option value="interior">Built-in Interior Photo</option>
                    <option value="custom">Custom HTTPS Image URL</option>
                  </select>
                </div>
                {item.imagePreset === "custom" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#3C3B37]">
                      HTTPS Image URL
                    </label>
                    <input
                      type="url"
                      value={item.customImageUrl || ""}
                      placeholder="https://..."
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          showcase: p.showcase.map((sc, i) =>
                            i === idx
                              ? { ...sc, customImageUrl: e.target.value }
                              : sc
                          ),
                        }))
                      }
                      className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                    />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#3C3B37]">
                    Lightbox Study Note
                  </label>
                  <textarea
                    rows={2}
                    value={item.studyNote}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        showcase: p.showcase.map((sc, i) =>
                          i === idx ? { ...sc, studyNote: e.target.value } : sc
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="border border-[#E4E0D7] bg-white p-6">
            <h3 className="font-serif text-xl font-bold text-[#1C1B19]">
              The Practice &amp; Closing CTA
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#3C3B37]">
                  Practice Headline
                </label>
                <input
                  type="text"
                  value={draft.practice.headline}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      practice: { ...p.practice, headline: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3C3B37]">
                  Green Visual Caption
                </label>
                <input
                  type="text"
                  value={draft.practice.visualCaption}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      practice: { ...p.practice, visualCaption: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#3C3B37]">
                  Practice Paragraph 1
                </label>
                <textarea
                  rows={2}
                  value={draft.practice.paragraph1}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      practice: { ...p.practice, paragraph1: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#3C3B37]">
                  Practice Paragraph 2
                </label>
                <textarea
                  rows={2}
                  value={draft.practice.paragraph2}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      practice: { ...p.practice, paragraph2: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3C3B37]">
                  Closing CTA Headline
                </label>
                <input
                  type="text"
                  value={draft.contact.headline}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      contact: { ...p.contact, headline: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3C3B37]">
                  Closing CTA Button Label
                </label>
                <input
                  type="text"
                  value={draft.contact.ctaLabel}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      contact: { ...p.contact, ctaLabel: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS MANAGEMENT */}
      {section === "orders" && (
        <div className="mt-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-[#E4E0D7] bg-white p-5">
            <h2 className="font-serif text-2xl font-bold text-[#1C1B19]">
              All Client Orders ({filteredOrders.length})
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {["All", ...ORDER_STATUSES].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrderFilter(st)}
                  className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
                    orderFilter === st
                      ? "bg-[#0D5C43] text-white"
                      : "bg-[#F4F1EA] text-[#4F4D48] hover:text-[#1C1B19]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="border border-[#E4E0D7] bg-white p-10 text-center text-sm text-[#585651]">
              No orders matching this filter yet.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <AdminOrderCard
                key={order.id}
                order={order}
                busy={updatingOrderId === order.id}
                onUpdate={handleUpdateOrder}
                onDelete={handleDeleteOrder}
              />
            ))
          )}
        </div>
      )}

      {/* USERS MANAGEMENT */}
      {section === "users" && (
        <div className="mt-8 border border-[#E4E0D7] bg-white p-6">
          <h2 className="font-serif text-2xl font-bold text-[#1C1B19]">
            Registered Accounts ({users.length})
          </h2>
          <p className="mt-1 text-xs text-[#6B6963]">
            Manage client member accounts and owner access.
          </p>

          <div className="mt-6 divide-y divide-[#ECE8E0] border-y border-[#ECE8E0]">
            {users.map((u) => {
              const isSelf = u.id === user.id;
              return (
                <div
                  key={u.id}
                  className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1C1B19]">
                      {u.name}{" "}
                      {isSelf && (
                        <span className="text-xs text-[#0D5C43]">(Owner)</span>
                      )}
                    </p>
                    <p className="text-xs text-[#6B6963]">
                      {u.email} · Joined{" "}
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <select
                      aria-label={`Role for ${u.email}`}
                      disabled={isSelf}
                      value={u.role}
                      onChange={(e) =>
                        void handleRoleToggle(u, e.target.value as UserRole)
                      }
                      className="rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-1.5 text-xs font-medium text-[#1C1B19] disabled:opacity-60"
                    >
                      <option value="user">Client User</option>
                      <option value="admin">Admin</option>
                    </select>
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteUser(u)}
                        className="inline-flex h-8 items-center gap-1 rounded-[3px] border border-[#E9C4B8] px-3 text-xs font-medium text-[#9A3412] hover:bg-[#FDF2EE]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MONGODB CONTROL */}
      {section === "mongodb" && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="border border-[#E4E0D7] bg-white p-6 sm:p-8 lg:col-span-7">
            <div className="flex items-center gap-2 text-[#0D5C43]">
              <Database className="h-5 w-5" />
              <p className="text-xs font-semibold tracking-[0.14em]">
                MONGODB CONNECTION CONTROL
              </p>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#1C1B19]">
              Connect Your MongoDB Database
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#585651]">
              Enter your MongoDB Atlas Cluster ID + credentials OR paste a full
              connection URI directly. Your website config, secret URL slug,
              users, and orders sync automatically.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-[4px] bg-[#F4F1EA] p-1">
              <button
                type="button"
                onClick={() => setMongoMode("cluster")}
                className={`min-h-10 rounded-[3px] px-3 py-2 text-xs font-semibold transition-colors ${
                  mongoMode === "cluster"
                    ? "bg-white text-[#0D5C43] shadow-xs"
                    : "text-[#585651] hover:text-[#1C1B19]"
                }`}
              >
                Quick Cluster ID Mode
              </button>
              <button
                type="button"
                onClick={() => setMongoMode("uri")}
                className={`min-h-10 rounded-[3px] px-3 py-2 text-xs font-semibold transition-colors ${
                  mongoMode === "uri"
                    ? "bg-white text-[#0D5C43] shadow-xs"
                    : "text-[#585651] hover:text-[#1C1B19]"
                }`}
              >
                Full Connection URI
              </button>
            </div>

            <form onSubmit={handleConnectMongo} className="mt-5 space-y-4">
              {mongoMode === "cluster" ? (
                <>
                  <div>
                    <label
                      htmlFor="mongo-cluster"
                      className="block text-xs font-semibold text-[#3C3B37]"
                    >
                      MongoDB Cluster ID / Host
                    </label>
                    <input
                      id="mongo-cluster"
                      type="text"
                      required
                      value={clusterId}
                      onChange={(e) => setClusterId(e.target.value)}
                      placeholder="cluster0.ab12c.mongodb.net"
                      className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 font-mono text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="mongo-user"
                        className="block text-xs font-semibold text-[#3C3B37]"
                      >
                        DB Username
                      </label>
                      <input
                        id="mongo-user"
                        type="text"
                        required
                        value={mongoUser}
                        onChange={(e) => setMongoUser(e.target.value)}
                        placeholder="akvai_admin"
                        className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="mongo-pass"
                        className="block text-xs font-semibold text-[#3C3B37]"
                      >
                        DB Password
                      </label>
                      <div className="relative mt-1.5">
                        <input
                          id="mongo-pass"
                          type={showMongoPass ? "text" : "password"}
                          required
                          value={mongoPass}
                          onChange={(e) => setMongoPass(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] py-2.5 pr-10 pl-3.5 text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMongoPass((p) => !p)}
                          aria-label="Toggle database password visibility"
                          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#6B6963]"
                        >
                          {showMongoPass ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label
                    htmlFor="mongo-uri"
                    className="block text-xs font-semibold text-[#3C3B37]"
                  >
                    MongoDB Connection URI
                  </label>
                  <input
                    id="mongo-uri"
                    type="password"
                    required
                    value={mongoUri}
                    onChange={(e) => setMongoUri(e.target.value)}
                    placeholder="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/akvai_associates"
                    className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 font-mono text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="mongo-dbname"
                  className="block text-xs font-semibold text-[#3C3B37]"
                >
                  Database Name
                </label>
                <input
                  id="mongo-dbname"
                  type="text"
                  value={mongoDbName}
                  onChange={(e) => setMongoDbName(e.target.value)}
                  placeholder="akvai_associates"
                  className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 font-mono text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <motion.button
                  type="submit"
                  disabled={connectingMongo}
                  whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[3px] bg-[#0D5C43] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#094734] disabled:opacity-60"
                >
                  {connectingMongo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <PlugZap className="h-4 w-4" />
                      <span>Connect &amp; Sync MongoDB</span>
                    </>
                  )}
                </motion.button>

                {mongoStatus?.connected && (
                  <button
                    type="button"
                    disabled={connectingMongo}
                    onClick={() => void handleDisconnectMongo()}
                    className="inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-[#E9C4B8] bg-[#FDF2EE] px-4 py-2.5 text-sm font-medium text-[#9A3412] hover:bg-[#FAE6DE]"
                  >
                    <Unplug className="h-4 w-4" />
                    <span>Disconnect</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="border border-[#1F1F1D] bg-[#1F1F1D] p-6 text-white sm:p-8 lg:col-span-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#E08A3C]">
              CONNECTION OVERVIEW
            </p>
            <h3 className="mt-2 font-serif text-2xl font-bold text-white">
              {mongoStatus?.connected
                ? "Connected to MongoDB"
                : "Using Local Runtime Store"}
            </h3>

            <dl className="mt-6 space-y-4 border-t border-[#33332F] pt-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#A5A39D]">Mode</dt>
                <dd className="font-mono text-xs text-white">
                  {mongoStatus?.connected
                    ? mongoStatus.source === "env"
                      ? "Vercel / Env MONGODB_URI"
                      : "Admin Live Connect"
                    : "In-Memory Local Store"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#A5A39D]">Cluster Host</dt>
                <dd className="truncate font-mono text-xs text-white">
                  {mongoStatus?.maskedHost || "Not connected"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#A5A39D]">Database</dt>
                <dd className="font-mono text-xs text-white">
                  {mongoStatus?.dbName || "akvai_associates"}
                </dd>
              </div>
              {mongoStatus?.latencyMs !== null &&
                mongoStatus?.latencyMs !== undefined && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[#A5A39D]">Ping Latency</dt>
                    <dd className="font-mono text-xs tabular-nums text-[#7FD3B2]">
                      {mongoStatus.latencyMs} ms
                    </dd>
                  </div>
                )}
            </dl>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#33332F] pt-5 text-center">
              <div className="bg-[#292926] p-3">
                <p className="font-mono text-lg font-semibold tabular-nums text-white">
                  {mongoStatus?.counts.users ?? users.length}
                </p>
                <p className="mt-0.5 text-[11px] text-[#A5A39D]">users</p>
              </div>
              <div className="bg-[#292926] p-3">
                <p className="font-mono text-lg font-semibold tabular-nums text-[#E08A3C]">
                  {mongoStatus?.counts.orders ?? allOrders.length}
                </p>
                <p className="mt-0.5 text-[11px] text-[#A5A39D]">orders</p>
              </div>
              <div className="bg-[#292926] p-3">
                <p className="font-mono text-lg font-semibold tabular-nums text-white">
                  {mongoStatus?.counts.services ?? draft.services.length}
                </p>
                <p className="mt-0.5 text-[11px] text-[#A5A39D]">services</p>
              </div>
            </div>

            <p className="mt-6 border-t border-[#33332F] pt-4 text-xs leading-relaxed text-[#A5A39D]">
              For permanent Vercel persistence across serverless restarts, set{" "}
              <code className="font-mono text-white">MONGODB_URI</code> in your
              Vercel Environment Variables.
            </p>
          </div>
        </div>
      )}

      {/* SECRET DYNAMIC URL & PASSWORD CONTROL */}
      {section === "security" && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="border border-[#E4E0D7] bg-white p-6 sm:p-8 lg:col-span-6">
            <div className="flex items-center gap-2 text-[#0D5C43]">
              <Link2 className="h-5 w-5" />
              <p className="text-xs font-semibold tracking-[0.14em]">
                DYNAMIC SECRET URL
              </p>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#1C1B19]">
              Rotate Your Hidden Admin Link
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#585651]">
              Change your secret portal slug anytime. The previous URL
              immediately turns into a 404 page and only your new link opens the
              Owner Console.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-[#E6E2D9] bg-[#FAF9F5] p-3.5">
              <code className="font-mono text-xs text-[#0D5C43]">
                {security?.portalPath || `/portal/${portalKey}`}
              </code>
              <button
                type="button"
                onClick={() => void handleCopyPortalUrl()}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-[3px] border border-[#D4CFC4] bg-white px-3 py-1 text-xs font-medium text-[#1C1B19] hover:bg-[#F4F1EA]"
              >
                {copiedUrl ? (
                  <Check className="h-3.5 w-3.5 text-[#0D5C43]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedUrl ? "Copied" : "Copy Full URL"}</span>
              </button>
            </div>

            {security?.slugControlledByEnv ? (
              <p className="mt-4 text-xs leading-relaxed text-[#6B6963]">
                Your secret URL slug is currently locked via the{" "}
                <code className="font-mono text-[#1C1B19]">ADMIN_SECRET_SLUG</code>{" "}
                environment variable. Change it in Vercel Environment Variables
                to rotate it.
              </p>
            ) : (
              <form onSubmit={handleRotateSlug} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="rotate-slug"
                    className="block text-xs font-semibold text-[#3C3B37]"
                  >
                    New Secret Slug
                  </label>
                  <input
                    id="rotate-slug"
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) =>
                      setNewSlug(
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                      )
                    }
                    placeholder="e.g. akvai-owner-7821"
                    className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 font-mono text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={rotatingSlug}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[3px] bg-[#0D5C43] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#094734] disabled:opacity-60"
                >
                  {rotatingSlug ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  <span>Update Secret URL</span>
                </button>
              </form>
            )}
          </div>

          <div className="border border-[#E4E0D7] bg-white p-6 sm:p-8 lg:col-span-6">
            <div className="flex items-center gap-2 text-[#DF7324]">
              <KeyRound className="h-5 w-5" />
              <p className="text-xs font-semibold tracking-[0.14em]">
                OWNER PASSWORD
              </p>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#1C1B19]">
              Update Private Password
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#585651]">
              Keep your hidden Owner Console password unique from client
              accounts.
            </p>

            {security?.passwordControlledByEnv ? (
              <p className="mt-5 text-xs leading-relaxed text-[#6B6963]">
                Owner password is set via{" "}
                <code className="font-mono text-[#1C1B19]">ADMIN_PASSWORD</code>{" "}
                in your server environment variables. Update it there to change
                your password.
              </p>
            ) : (
              <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="curr-pass"
                    className="block text-xs font-semibold text-[#3C3B37]"
                  >
                    Current Owner Password
                  </label>
                  <input
                    id="curr-pass"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-pass"
                    className="block text-xs font-semibold text-[#3C3B37]"
                  >
                    New Owner Password
                  </label>
                  <input
                    id="new-pass"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updatingPass}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[3px] bg-[#E07A22] px-5 py-2.5 text-sm font-semibold text-[#1A1918] hover:bg-[#CF6C18] disabled:opacity-60"
                >
                  {updatingPass ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  <span>Save New Password</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminOrderCard({
  order,
  busy,
  onUpdate,
  onDelete,
}: {
  order: OrderItem;
  busy: boolean;
  onUpdate: (id: string, status: OrderStatus, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState(order.adminNote);

  return (
    <div className="border border-[#E4E0D7] bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#F0ECE4] pb-4">
        <div>
          <p className="font-mono text-xs font-semibold text-[#0D5C43]">
            {order.id} · {order.projectType} · {order.budgetRange}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#1C1B19]">
            {order.serviceTitle}
          </h3>
          <p className="mt-0.5 text-xs text-[#6B6963]">
            Client: {order.userName} ({order.userEmail}) · Site: {order.location}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onDelete(order.id)}
          className="inline-flex h-9 items-center gap-1 rounded-[3px] px-2.5 text-xs font-medium text-[#9A3412] hover:bg-[#FDF2EE]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#4E4C47]">
        {order.message}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-[#F0ECE4] pt-4 md:grid-cols-12">
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-[#3C3B37]">
            Order Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
          >
            {ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-6">
          <label className="block text-xs font-semibold text-[#3C3B37]">
            Architect Note (visible to client)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Initial site review scheduled for Tuesday."
            className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end md:col-span-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onUpdate(order.id, status, note)}
            className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-[3px] bg-[#0D5C43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#094734] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Update Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}
