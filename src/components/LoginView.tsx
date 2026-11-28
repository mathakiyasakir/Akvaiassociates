"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useApp } from "@/components/AppContext";
import type { PublicUser } from "@/lib/types";

type AuthMode = "login" | "register";
type RegisterStep = "details" | "otp";

export function LoginView() {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const { setSession, loginIntentToken, clearLoginIntent } = useApp();

  const [mode, setMode] = useState<AuthMode>("login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("details");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [challengeId, setChallengeId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setRegisterStep("details");
    setChallengeId("");
    setOtpCode("");
    setError(null);
    setInfoMsg(null);
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loginIntentToken) {
      router.replace("/");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Intent": loginIntentToken,
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = (await res.json()) as {
        user?: PublicUser;
        token?: string;
        error?: string;
      };

      if (res.status === 403) {
        clearLoginIntent();
        router.replace("/");
        return;
      }

      if (!res.ok || !data.user || !data.token) {
        setError(data.error || "Unable to sign in. Please check your details.");
        return;
      }

      const dest = setSession(data.user, data.token);
      router.replace(dest);
    } catch {
      setError("Network error while connecting to server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const requestRegistrationOtp = async () => {
    if (!loginIntentToken) {
      router.replace("/");
      return;
    }

    setError(null);
    setInfoMsg(null);

    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Intent": loginIntentToken,
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password,
      }),
    });

    const data = (await res.json()) as {
      challengeId?: string;
      maskedEmail?: string;
      expiresInSeconds?: number;
      resendAfterSeconds?: number;
      retryAfterSeconds?: number;
      error?: string;
    };

    if (res.status === 403) {
      clearLoginIntent();
      router.replace("/");
      return;
    }

    if (!res.ok || !data.challengeId) {
      if (typeof data.retryAfterSeconds === "number") {
        setResendCooldown(data.retryAfterSeconds);
      }
      setError(
        data.error || "Could not send verification code. Please check your details."
      );
      return;
    }

    setChallengeId(data.challengeId);
    setMaskedEmail(data.maskedEmail || email.trim());
    setOtpCode("");
    setRegisterStep("otp");
    setResendCooldown(data.resendAfterSeconds ?? 45);
    setInfoMsg(
      `A 6-digit verification code has been emailed to ${data.maskedEmail || email.trim()}.`
    );
  };

  const handleRequestOtpSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await requestRegistrationOtp();
    } catch {
      setError("Network error while sending OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await requestRegistrationOtp();
    } catch {
      setError("Network error while resending OTP.");
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtpSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!loginIntentToken) {
      router.replace("/");
      return;
    }

    const cleanCode = otpCode.replace(/\D/g, "").slice(0, 6);
    if (cleanCode.length !== 6) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Intent": loginIntentToken,
        },
        body: JSON.stringify({
          challengeId,
          email: email.trim(),
          otp: cleanCode,
        }),
      });

      const data = (await res.json()) as {
        user?: PublicUser;
        token?: string;
        locked?: boolean;
        error?: string;
      };

      if (res.status === 403) {
        clearLoginIntent();
        router.replace("/");
        return;
      }

      if (!res.ok || !data.user || !data.token) {
        setError(data.error || "Verification failed. Please check the code.");
        if (data.locked) {
          setChallengeId("");
          setOtpCode("");
          setRegisterStep("details");
        }
        return;
      }

      const dest = setSession(data.user, data.token);
      router.replace(dest);
    } catch {
      setError("Network error while verifying OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1C1B19]">
      <header className="border-b border-[#E5E1D8] bg-white">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            onClick={() => clearLoginIntent()}
            aria-label="Back to Akvai Associates"
          >
            <BrandLogo className="h-12 w-auto object-contain" />
          </Link>
          <Link
            href="/"
            onClick={() => clearLoginIntent()}
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
            Sign in or create an OTP-verified account to explore services in
            detail, submit project briefs, and follow progress with our studio.
          </p>

          <div className="mt-8 border-t border-[#DED9CE] pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border border-[#E4E0D7] bg-white p-5">
                <p className="font-mono text-xs font-medium text-[#0D5C43]">
                  01 /
                </p>
                <p className="mt-2 text-sm font-semibold text-[#1C1B19]">
                  Email OTP Verified
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#5C5A55]">
                  Every new account is verified with a one-time 6-digit email
                  security code before activation.
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
                  Submit architectural briefs directly and track studio updates
                  privately in one place.
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
                onClick={() => switchMode("login")}
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
                onClick={() => switchMode("register")}
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
              {mode === "login"
                ? "Sign in to continue."
                : registerStep === "otp"
                  ? "Verify your email OTP."
                  : "Create your account."}
            </h2>
            <p className="mt-1 text-sm text-[#585651]">
              {mode === "login"
                ? "Enter your email and password to continue."
                : registerStep === "otp"
                  ? `Enter the 6-digit code sent to ${maskedEmail}.`
                  : "We will email a 6-digit verification code to confirm your account."}
            </p>
          </div>

          {mode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-[#3C3B37]"
                >
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7A7872]" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] py-2.5 pr-4 pl-10 text-sm text-[#1C1B19] placeholder:text-[#8E8C85] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-[#3C3B37]"
                >
                  Password
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7A7872]" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
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
                    <span>Signing in...</span>
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
          )}

          {mode === "register" && registerStep === "details" && (
            <form onSubmit={handleRequestOtpSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-semibold text-[#3C3B37]"
                >
                  Full Name
                </label>
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7A7872]" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] py-2.5 pr-4 pl-10 text-sm text-[#1C1B19] placeholder:text-[#8E8C85] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold text-[#3C3B37]"
                >
                  Email Address (OTP will be sent here)
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7A7872]" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] py-2.5 pr-4 pl-10 text-sm text-[#1C1B19] placeholder:text-[#8E8C85] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold text-[#3C3B37]"
                >
                  Create Strong Password
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7A7872]" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Min 8 chars (letters + numbers)"
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
                <p className="mt-1 text-[11px] text-[#6B6963]">
                  Use at least 8 characters with both letters and numbers.
                </p>
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
                className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-[#0D5C43] px-6 py-3 text-sm font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-[#094734] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending OTP to Email...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Send Verification OTP</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>
          )}

          {mode === "register" && registerStep === "otp" && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              {infoMsg && (
                <div className="flex items-start gap-2.5 rounded-[3px] border border-[#C6DCD1] bg-[#E5EFEA] px-3.5 py-3 text-xs font-medium text-[#0D5C43]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="reg-otp"
                  className="block text-xs font-semibold text-[#3C3B37]"
                >
                  6-Digit Verification Code
                </label>
                <div className="relative mt-1.5">
                  <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#0D5C43]" />
                  <input
                    id="reg-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(event) =>
                      setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    className="w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] py-3 pr-4 pl-10 text-center font-mono text-xl font-bold tracking-[0.35em] text-[#1C1B19] placeholder:text-[#B5B2A9] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-[#6B6963]">
                  Code expires in 5 minutes and locks after 5 incorrect attempts.
                </p>
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
                disabled={submitting || otpCode.length !== 6}
                whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-6 py-3 text-sm font-semibold text-[#1A1918] shadow-xs transition-colors duration-150 hover:bg-[#CF6C18] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verify OTP & Create Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ECE8E0] pt-4 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterStep("details");
                    setError(null);
                    setInfoMsg(null);
                  }}
                  className="font-medium text-[#585651] hover:text-[#1C1B19]"
                >
                  Change email address
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || resending}
                  onClick={() => void handleResendOtp()}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#0D5C43] hover:text-[#08402E] disabled:cursor-not-allowed disabled:text-[#8E8C85]"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`}
                  />
                  <span>
                    {resendCooldown > 0
                      ? `Resend OTP in ${resendCooldown}s`
                      : "Resend OTP"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
}
