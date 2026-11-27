"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import akvaiLogo from "../../public/images/akvai-logo.png";
import { useApp } from "@/components/AppContext";
import type { PublicUser } from "@/lib/types";

type AuthMode = "login" | "register";

export function LoginView() {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const { setSession } = useApp();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const endpoint =
        mode === "register" ? "/api/auth/register" : "/api/auth/login";

      const payload =
        mode === "login"
          ? { email: email.trim(), password }
          : { name: name.trim(), email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        user?: PublicUser;
        token?: string;
        error?: string;
      };

      if (!res.ok || !data.user || !data.token) {
        setError(data.error || "Unable to sign in. Please check your details.");
        return;
      }

      setSession(data.user, data.token);
      router.replace("/");
    } catch {
      setError("Network error while connecting to server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1C1B19]">
      <header className="border-b border-[#E5E1D8] bg-white">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
          <Link href="/" aria-label="Back to Akvai Associates">
            <Image
              src={akvaiLogo}
              alt="Akvai Associates"
              width={92}
              height={60}
              priority
              referrerPolicy="no-referrer"
              className="h-12 w-auto object-contain"
            />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#4B4A46] transition-colors hover:text-[#0D5C43]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to website</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl grid-cols-1 items-center gap-12 px-6 py-12 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-6">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
            <span>AKVAI ASSOCIATES</span>
            <span aria-hidden="true" className="mx-2 text-[#8EA69B]">
              /
            </span>
            <span>ARCHITECTURAL PRACTICE</span>
          </p>
          <h1 className="mt-4 max-w-lg text-balance font-serif text-4xl leading-[1.1] font-bold tracking-tight text-[#1C1B19] sm:text-5xl">
            Spaces shaped for the way you live.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#575550]">
            Sign in or create an account to explore services in detail, save
            your project enquiries, and follow updates from our team.
          </p>

          <div className="mt-8 border-t border-[#DED9CE] pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border border-[#E4E0D7] bg-white p-5">
                <p className="font-mono text-xs font-medium text-[#0D5C43]">
                  01 /
                </p>
                <p className="mt-2 text-sm font-semibold text-[#1C1B19]">
                  Architectural Services
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#5C5A55]">
                  Residential, commercial, interior design, planning, and 3D
                  visualization disciplines.
                </p>
              </div>
              <div className="border border-[#E4E0D7] bg-white p-5">
                <p className="font-mono text-xs font-medium text-[#0D5C43]">
                  02 /
                </p>
                <p className="mt-2 text-sm font-semibold text-[#1C1B19]">
                  Project Tracking
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#5C5A55]">
                  Submit your project brief directly and follow every design
                  milestone in one place.
                </p>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="border border-[#DDD8CE] bg-white p-7 shadow-[0_20px_50px_-24px_rgba(24,28,26,0.16)] sm:p-9 lg:col-span-6"
        >
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-1.5 rounded-[4px] bg-[#F4F1EA] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[3px] px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                  mode === "login"
                    ? "bg-white text-[#0D5C43] shadow-xs"
                    : "text-[#585651] hover:text-[#1C1B19]"
                }`}
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[3px] px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                  mode === "register"
                    ? "bg-white text-[#0D5C43] shadow-xs"
                    : "text-[#585651] hover:text-[#1C1B19]"
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
              </button>
            </div>

            <h2 className="mt-5 font-serif text-2xl font-bold text-[#1C1B19]">
              {mode === "login" ? "Sign in to continue." : "Create your account."}
            </h2>
            <p className="mt-1 text-sm text-[#585651]">
              {mode === "login"
                ? "Enter your email and password to continue."
                : "Register with your name, email, and password."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-[#3C3B37]"
                >
                  Full Name
                </label>
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7A7872]" />
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] py-2.5 pr-4 pl-10 text-sm text-[#1C1B19] placeholder:text-[#8E8C85] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-[#3C3B37]"
              >
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7A7872]" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] py-2.5 pr-4 pl-10 text-sm text-[#1C1B19] placeholder:text-[#8E8C85] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-[#3C3B37]"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7A7872]" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] py-2.5 pr-11 pl-10 text-sm text-[#1C1B19] placeholder:text-[#8E8C85] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-2.5 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#6A6862] hover:text-[#1C1B19]"
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
              <div
                role="alert"
                className="rounded-[3px] border border-[#E9C4B8] bg-[#FDF2EE] px-3.5 py-2.5 text-xs font-medium text-[#9A3412]"
              >
                {error}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={prefersReducedMotion ? undefined : { y: -1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-6 py-3 text-sm font-semibold text-[#1A1918] shadow-xs transition-colors duration-150 hover:bg-[#CF6C18] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : mode === "register" ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
