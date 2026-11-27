"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import akvaiLogo from "../../public/images/akvai-logo.png";
import { useApp } from "@/components/AppContext";
import { AdminPanel } from "@/components/AdminPanel";
import type { PublicUser } from "@/lib/types";

interface HiddenAdminPortalProps {
  portalKey: string;
  initialMode: "setup" | "portal";
  slugControlledByEnv: boolean;
  suggestedEmail: string;
}

export function HiddenAdminPortal({
  portalKey,
  initialMode,
  slugControlledByEnv,
  suggestedEmail,
}: HiddenAdminPortalProps) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const { user, setSession, logout } = useApp();

  const [mode, setMode] = useState<"setup" | "portal">(initialMode);
  const [customSlug, setCustomSlug] = useState("");
  const [name, setName] = useState("Akvai Owner");
  const [email, setEmail] = useState(initialMode === "setup" ? suggestedEmail : "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticatedAdmin = Boolean(user && user.role === "admin");

  const handleSetupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/setup-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalKey,
          customSlug: customSlug.trim().toLowerCase(),
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      const data = (await res.json()) as {
        user?: PublicUser;
        token?: string;
        portalPath?: string;
        error?: string;
      };
      if (!res.ok || !data.user || !data.token) {
        setError(data.error || "Could not complete owner vault setup.");
        return;
      }

      setSession(data.user, data.token);
      setMode("portal");
      if (data.portalPath && data.portalPath !== `/portal/${portalKey}`) {
        router.replace(data.portalPath);
      }
    } catch {
      setError("Network error while setting up the owner portal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalKey,
          email: email.trim(),
          password,
        }),
      });
      const data = (await res.json()) as {
        user?: PublicUser;
        token?: string;
        error?: string;
      };
      if (!res.ok || !data.user || !data.token) {
        setError(data.error || "Invalid owner credentials.");
        return;
      }
      setSession(data.user, data.token);
      setPassword("");
    } catch {
      setError("Network error while verifying owner credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthenticatedAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] text-[#1C1B19]">
        <header className="sticky top-0 z-40 border-b border-[#2C2C29] bg-[#171715] text-white">
          <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-6 px-6">
            <div className="flex items-center gap-3">
              <div className="rounded-[3px] bg-white px-2 py-1">
                <Image
                  src={akvaiLogo}
                  alt="Akvai Associates"
                  width={68}
                  height={44}
                  priority
                  referrerPolicy="no-referrer"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <span className="hidden text-xs font-semibold tracking-[0.14em] text-[#E08A3C] sm:inline">
                PRIVATE OWNER CONSOLE
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex min-h-9 items-center rounded-[3px] border border-[#3E3E39] px-3.5 py-1.5 text-xs font-medium text-[#E4E2DC] transition-colors hover:border-[#6B6A62] hover:text-white"
              >
                View Website
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-[3px] bg-[#E07A22] px-3.5 py-1.5 text-xs font-semibold text-[#1A1918] transition-colors hover:bg-[#CF6C18]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Lock Vault</span>
              </button>
            </div>
          </div>
        </header>

        <AdminPanel portalKey={portalKey} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#141413] text-white">
      <header className="border-b border-[#262623] bg-[#181816]">
        <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between px-6">
          <div className="rounded-[3px] bg-white px-2.5 py-1">
            <Image
              src={akvaiLogo}
              alt="Akvai Associates"
              width={78}
              height={50}
              priority
              referrerPolicy="no-referrer"
              className="h-9 w-auto object-contain"
            />
          </div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#E08A3C]">
            <KeyRound className="h-4 w-4" />
            <span>PRIVATE OWNER ACCESS</span>
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-6 py-12">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full border border-[#2E2E2A] bg-[#1D1D1B] p-7 shadow-2xl sm:p-9"
        >
          {mode === "setup" ? (
            <>
              <div className="flex items-center gap-2 text-[#7FD3B2]">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-xs font-semibold tracking-[0.14em]">
                  ONE-TIME OWNER VAULT SETUP
                </p>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-bold text-white">
                Set your secret URL &amp; password
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#B3B1AA]">
                Choose a private dynamic URL slug that only you know, plus your
                owner password. Once saved, this setup link locks permanently
                into a 404 page.
              </p>

              <form onSubmit={handleSetupSubmit} className="mt-6 space-y-4">
                {!slugControlledByEnv && (
                  <div>
                    <label
                      htmlFor="owner-slug"
                      className="block text-xs font-semibold text-[#D6D4CE]"
                    >
                      Your Secret Admin URL Slug
                    </label>
                    <div className="relative mt-1.5">
                      <Link2 className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#8E8C85]" />
                      <input
                        id="owner-slug"
                        type="text"
                        required
                        value={customSlug}
                        onChange={(e) =>
                          setCustomSlug(
                            e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                          )
                        }
                        placeholder="e.g. akvai-vault-9042"
                        className="w-full rounded-[3px] border border-[#3B3B36] bg-[#141412] py-2.5 pr-4 pl-10 font-mono text-sm text-white placeholder:text-[#6E6C66] focus:border-[#E07A22] focus:outline-none"
                      />
                    </div>
                    <p className="mt-1.5 font-mono text-[11px] text-[#9E9C95]">
                      Secret URL:{" "}
                      <span className="text-[#E08A3C]">
                        /portal/{customSlug || "your-secret-slug"}
                      </span>
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="owner-name"
                    className="block text-xs font-semibold text-[#D6D4CE]"
                  >
                    Owner Name
                  </label>
                  <div className="relative mt-1.5">
                    <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#8E8C85]" />
                    <input
                      id="owner-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-[3px] border border-[#3B3B36] bg-[#141412] py-2.5 pr-4 pl-10 text-sm text-white focus:border-[#E07A22] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="owner-email"
                    className="block text-xs font-semibold text-[#D6D4CE]"
                  >
                    Owner Email
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#8E8C85]" />
                    <input
                      id="owner-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-[3px] border border-[#3B3B36] bg-[#141412] py-2.5 pr-4 pl-10 text-sm text-white focus:border-[#E07A22] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="owner-pass"
                    className="block text-xs font-semibold text-[#D6D4CE]"
                  >
                    Owner Secret Password
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#8E8C85]" />
                    <input
                      id="owner-pass"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-[3px] border border-[#3B3B36] bg-[#141412] py-2.5 pr-11 pl-10 text-sm text-white placeholder:text-[#6E6C66] focus:border-[#E07A22] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label="Toggle password visibility"
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#9E9C95] hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-[3px] border border-[#7C2D12] bg-[#3A160C] px-3.5 py-2.5 text-xs font-medium text-[#FDBA74]"
                  >
                    {error}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-6 py-3 text-sm font-semibold text-[#1A1918] transition-colors hover:bg-[#CF6C18] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Locking Vault...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Activate Private Admin URL</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-[#E08A3C]">
                <Lock className="h-4 w-4" />
                <p className="text-xs font-semibold tracking-[0.14em]">
                  VERIFIED OWNER GATE
                </p>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-bold text-white">
                Unlock Admin Panel
              </h1>
              <p className="mt-2 text-sm text-[#B3B1AA]">
                Enter your private owner email and password to access website
                controls and MongoDB settings.
              </p>

              <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="admin-email"
                    className="block text-xs font-semibold text-[#D6D4CE]"
                  >
                    Owner Email
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#8E8C85]" />
                    <input
                      id="admin-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@example.com"
                      className="w-full rounded-[3px] border border-[#3B3B36] bg-[#141412] py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-[#6E6C66] focus:border-[#E07A22] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-password"
                    className="block text-xs font-semibold text-[#D6D4CE]"
                  >
                    Owner Password
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#8E8C85]" />
                    <input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your secret password"
                      className="w-full rounded-[3px] border border-[#3B3B36] bg-[#141412] py-2.5 pr-11 pl-10 text-sm text-white placeholder:text-[#6E6C66] focus:border-[#E07A22] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label="Toggle password visibility"
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#9E9C95] hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-[3px] border border-[#7C2D12] bg-[#3A160C] px-3.5 py-2.5 text-xs font-medium text-[#FDBA74]"
                  >
                    {error}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-6 py-3 text-sm font-semibold text-[#1A1918] transition-colors hover:bg-[#CF6C18] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Unlock Owner Console</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </form>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
