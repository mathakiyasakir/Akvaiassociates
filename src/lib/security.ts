import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

interface RateBucket {
  timestamps: number[];
}

interface PendingOtpChallenge {
  challengeId: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  otpHash: string;
  expiresAt: number;
  createdAt: number;
  attempts: number;
  maxAttempts: number;
}

interface SecurityRuntimeState {
  hmacSecret: string;
  rateLimits: Map<string, RateBucket>;
  otpChallenges: Map<string, PendingOtpChallenge>;
  lastOtpSentByEmail: Map<string, number>;
}

const globalForSecurity = globalThis as unknown as {
  __akvaiSecurityState?: SecurityRuntimeState;
};

export function getSharedHmacSecret(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }

  // On Vercel serverless, different API routes run in separate instances.
  // Derive a consistent server-only HMAC key from deployment-scoped server env vars.
  const deploymentSeedParts = [
    process.env.ADMIN_PASSWORD,
    process.env.ADMIN_SECRET_SLUG,
    process.env.MONGODB_URI,
    process.env.VERCEL_PROJECT_ID,
    process.env.VERCEL_DEPLOYMENT_ID,
    process.env.VERCEL_URL,
  ]
    .map((v) => v?.trim() || "")
    .filter(Boolean);

  if (deploymentSeedParts.length > 0) {
    return crypto
      .createHash("sha256")
      .update(`akvai-hmac-v1:${deploymentSeedParts.join("|")}`)
      .digest("hex");
  }

  return crypto.randomBytes(32).toString("hex");
}

function getSecurityState(): SecurityRuntimeState {
  if (!globalForSecurity.__akvaiSecurityState) {
    globalForSecurity.__akvaiSecurityState = {
      hmacSecret: getSharedHmacSecret(),
      rateLimits: new Map(),
      otpChallenges: new Map(),
      lastOtpSentByEmail: new Map(),
    };
  }
  return globalForSecurity.__akvaiSecurityState;
}

export function secureJson(
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> }
): NextResponse {
  const res = NextResponse.json(body, { status: init?.status ?? 200 });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("X-Content-Type-Options", "nosniff");
  if (init?.headers) {
    for (const [k, v] of Object.entries(init.headers)) {
      res.headers.set(k, v);
    }
  }
  return res;
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  return "unknown";
}

export function verifySameOrigin(request: NextRequest): boolean {
  const expectedHost = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  )
    .split(",")[0]
    ?.trim()
    .toLowerCase();

  if (!expectedHost) return true;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      return originHost === expectedHost;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererHost = new URL(referer).host.toLowerCase();
      return refererHost === expectedHost;
    } catch {
      return false;
    }
  }

  // Allow direct non-browser calls only when explicit same-origin header isn't spoofed;
  // for browser forms/fetch, Origin or Referer is always attached.
  return false;
}

export function hasUnsafeKeys(value: unknown, depth = 0): boolean {
  if (depth > 8 || value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return value.some((item) => hasUnsafeKeys(item, depth + 1));
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (
      key.startsWith("$") ||
      key.includes(".") ||
      key === "__proto__" ||
      key === "constructor" ||
      key === "prototype"
    ) {
      return true;
    }
    if (hasUnsafeKeys(nested, depth + 1)) return true;
  }
  return false;
}

export function checkRateLimit(params: {
  bucket: string;
  key: string;
  maxRequests: number;
  windowMs: number;
}): { allowed: boolean; retryAfterSeconds: number; remaining: number } {
  const state = getSecurityState();
  const now = Date.now();
  const fullKey = `${params.bucket}:${params.key}`;

  // Periodic bounded cleanup
  if (state.rateLimits.size > 2000) {
    for (const [k, entry] of state.rateLimits.entries()) {
      const fresh = entry.timestamps.filter((t) => now - t < 3600_000);
      if (fresh.length === 0) {
        state.rateLimits.delete(k);
      } else {
        entry.timestamps = fresh;
      }
    }
  }

  const existing = state.rateLimits.get(fullKey) || { timestamps: [] };
  existing.timestamps = existing.timestamps.filter(
    (ts) => now - ts < params.windowMs
  );

  if (existing.timestamps.length >= params.maxRequests) {
    const oldest = existing.timestamps[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + params.windowMs - now) / 1000)
    );
    state.rateLimits.set(fullKey, existing);
    return { allowed: false, retryAfterSeconds, remaining: 0 };
  }

  existing.timestamps.push(now);
  state.rateLimits.set(fullKey, existing);
  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, params.maxRequests - existing.timestamps.length),
  };
}

export function validateStrongPassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return {
      valid: false,
      error: "Password must be 8 to 128 characters long.",
    };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      valid: false,
      error: "Password must include at least one letter and one number.",
    };
  }
  return { valid: true };
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// --- Server-Issued Login Intent Gate (blocks direct /login or /#login URL access) ---

interface LoginIntentPayload {
  kind: "akvai-login-intent";
  nonce: string;
  exp: number;
}

export function signLoginIntentToken(): { token: string; expiresInSeconds: number } {
  const state = getSecurityState();
  const ttlMs = 15 * 60 * 1000; // 15 minutes
  const payload: LoginIntentPayload = {
    kind: "akvai-login-intent",
    nonce: crypto.randomBytes(12).toString("hex"),
    exp: Date.now() + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", state.hmacSecret)
    .update(`intent:${encoded}`)
    .digest("base64url");
  return {
    token: `${encoded}.${sig}`,
    expiresInSeconds: Math.floor(ttlMs / 1000),
  };
}

export function verifyLoginIntentToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0) return false;
  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!sig) return false;

  const state = getSecurityState();
  const expected = crypto
    .createHmac("sha256", state.hmacSecret)
    .update(`intent:${encoded}`)
    .digest("base64url");
  if (!safeEqual(sig, expected)) return false;

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as LoginIntentPayload;
    return (
      parsed.kind === "akvai-login-intent" &&
      typeof parsed.exp === "number" &&
      Date.now() <= parsed.exp
    );
  } catch {
    return false;
  }
}

// --- Cryptographic Server-Side Email OTP Store ---

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 45 * 1000; // 45 seconds
const OTP_MAX_ATTEMPTS = 5;

function hashOtp(otp: string, salt: string): string {
  const state = getSecurityState();
  return crypto
    .createHmac("sha256", state.hmacSecret)
    .update(`${salt}:${otp}`)
    .digest("hex");
}

function purgeExpiredOtps(): void {
  const state = getSecurityState();
  const now = Date.now();
  for (const [id, ch] of state.otpChallenges.entries()) {
    if (now > ch.expiresAt) {
      state.otpChallenges.delete(id);
    }
  }
  for (const [email, ts] of state.lastOtpSentByEmail.entries()) {
    if (now - ts > 15 * 60 * 1000) {
      state.lastOtpSentByEmail.delete(email);
    }
  }
}

export function createOtpChallenge(input: {
  name: string;
  email: string;
  passwordHash: string;
}):
  | {
      ok: true;
      challengeId: string;
      otpCode: string;
      expiresInSeconds: number;
      resendAfterSeconds: number;
    }
  | { ok: false; error: string; retryAfterSeconds?: number } {
  purgeExpiredOtps();
  const state = getSecurityState();
  const normalizedEmail = input.email.trim().toLowerCase();
  const now = Date.now();

  const lastSent = state.lastOtpSentByEmail.get(normalizedEmail);
  if (lastSent && now - lastSent < OTP_RESEND_COOLDOWN_MS) {
    const waitSec = Math.max(
      1,
      Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - lastSent)) / 1000)
    );
    return {
      ok: false,
      error: `Please wait ${waitSec} seconds before requesting another verification code.`,
      retryAfterSeconds: waitSec,
    };
  }

  // Invalidate any previous active OTP challenge for the same email
  for (const [id, existing] of state.otpChallenges.entries()) {
    if (existing.email === normalizedEmail) {
      state.otpChallenges.delete(id);
    }
  }

  const otpCode = String(crypto.randomInt(100000, 1000000));
  const salt = crypto.randomBytes(16).toString("hex");
  const challengeId = `otp_${crypto.randomBytes(16).toString("hex")}`;

  state.otpChallenges.set(challengeId, {
    challengeId,
    email: normalizedEmail,
    name: input.name.trim(),
    passwordHash: input.passwordHash,
    salt,
    otpHash: hashOtp(otpCode, salt),
    expiresAt: now + OTP_TTL_MS,
    createdAt: now,
    attempts: 0,
    maxAttempts: OTP_MAX_ATTEMPTS,
  });

  state.lastOtpSentByEmail.set(normalizedEmail, now);

  return {
    ok: true,
    challengeId,
    otpCode,
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    resendAfterSeconds: Math.floor(OTP_RESEND_COOLDOWN_MS / 1000),
  };
}

export function rollbackOtpChallenge(challengeId: string, email: string): void {
  const state = getSecurityState();
  state.otpChallenges.delete(challengeId);
  state.lastOtpSentByEmail.delete(email.trim().toLowerCase());
}

export function verifyAndConsumeOtpChallenge(input: {
  challengeId: string;
  email: string;
  otp: string;
}):
  | {
      ok: true;
      name: string;
      email: string;
      passwordHash: string;
    }
  | { ok: false; error: string; locked?: boolean } {
  purgeExpiredOtps();
  const state = getSecurityState();
  const challenge = state.otpChallenges.get(input.challengeId);
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!challenge || challenge.email !== normalizedEmail) {
    return {
      ok: false,
      error: "Verification code expired or invalid. Please request a new code.",
    };
  }

  if (Date.now() > challenge.expiresAt) {
    state.otpChallenges.delete(challenge.challengeId);
    return {
      ok: false,
      error: "Verification code has expired. Please request a new code.",
    };
  }

  const cleanOtp = input.otp.trim();
  if (!/^\d{6}$/.test(cleanOtp)) {
    return {
      ok: false,
      error: "Please enter the 6-digit verification code sent to your email.",
    };
  }

  challenge.attempts += 1;
  const candidateHash = hashOtp(cleanOtp, challenge.salt);
  const matched = safeEqual(candidateHash, challenge.otpHash);

  if (!matched) {
    if (challenge.attempts >= challenge.maxAttempts) {
      state.otpChallenges.delete(challenge.challengeId);
      return {
        ok: false,
        locked: true,
        error: "Too many incorrect attempts. This code has been invalidated; please request a new one.",
      };
    }
    const left = challenge.maxAttempts - challenge.attempts;
    return {
      ok: false,
      error: `Incorrect verification code. ${left} attempt${left === 1 ? "" : "s"} remaining.`,
    };
  }

  // Atomic one-time consumption
  state.otpChallenges.delete(challenge.challengeId);

  return {
    ok: true,
    name: challenge.name,
    email: challenge.email,
    passwordHash: challenge.passwordHash,
  };
}
