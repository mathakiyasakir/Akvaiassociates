import { NextRequest } from "next/server";
import { attachSessionCookie, signSessionToken } from "@/lib/auth";
import {
  checkRateLimit,
  getClientIp,
  hasUnsafeKeys,
  secureJson,
  verifyAndConsumeOtpChallenge,
  verifyLoginIntentToken,
  verifySameOrigin,
} from "@/lib/security";
import { createUser, findUserByEmail } from "@/lib/store";

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return secureJson({ error: "Forbidden request origin." }, { status: 403 });
  }

  const intentToken = request.headers.get("x-auth-intent");
  if (!verifyLoginIntentToken(intentToken)) {
    return secureJson(
      { error: "Session gate expired. Please start from the website." },
      { status: 403 }
    );
  }

  const ip = getClientIp(request);
  const ipLimit = checkRateLimit({
    bucket: "otp-verify-ip",
    key: ip,
    maxRequests: 15,
    windowMs: 15 * 60 * 1000,
  });
  if (!ipLimit.allowed) {
    return secureJson(
      {
        error: `Too many verification attempts. Try again in ${ipLimit.retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureJson({ error: "Invalid request payload." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || hasUnsafeKeys(body)) {
    return secureJson({ error: "Invalid input detected." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const challengeId =
    typeof record.challengeId === "string" ? record.challengeId.trim() : "";
  const email =
    typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const otp = typeof record.otp === "string" ? record.otp.trim() : "";

  if (!challengeId || !email || !otp) {
    return secureJson(
      { error: "Verification code and email are required." },
      { status: 400 }
    );
  }

  const verified = verifyAndConsumeOtpChallenge({ challengeId, email, otp });
  if (!verified.ok) {
    return secureJson(
      { error: verified.error, locked: Boolean(verified.locked) },
      { status: 400 }
    );
  }

  // Prevent race-condition duplicate registration
  const existing = await findUserByEmail(verified.email);
  if (existing) {
    return secureJson(
      { error: "An account with this email already exists. Please sign in." },
      { status: 409 }
    );
  }

  // Always force role: "user" from server-stored verified challenge fields
  const user = await createUser({
    name: verified.name,
    email: verified.email,
    passwordHash: verified.passwordHash,
    role: "user",
    emailVerified: true,
  });

  const token = signSessionToken(user);
  return attachSessionCookie(
    secureJson({ user, token }, { status: 201 }),
    token,
    request
  );
}
