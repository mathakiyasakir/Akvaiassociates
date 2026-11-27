import { NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/mailer";
import {
  checkRateLimit,
  createOtpChallenge,
  getClientIp,
  hasUnsafeKeys,
  rollbackOtpChallenge,
  secureJson,
  validateStrongPassword,
  verifyLoginIntentToken,
  verifySameOrigin,
} from "@/lib/security";
import { findUserByEmail } from "@/lib/store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function maskTargetEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

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
    bucket: "otp-req-ip",
    key: ip,
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!ipLimit.allowed) {
    return secureJson(
      {
        error: `Too many OTP requests from this connection. Try again in ${ipLimit.retryAfterSeconds}s.`,
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
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const email =
    typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (name.length < 2 || name.length > 80) {
    return secureJson(
      { error: "Please enter your full name (2 to 80 characters)." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email) || email.length > 160) {
    return secureJson(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const passCheck = validateStrongPassword(password);
  if (!passCheck.valid) {
    return secureJson(
      { error: passCheck.error || "Please choose a stronger password." },
      { status: 400 }
    );
  }

  const emailLimit = checkRateLimit({
    bucket: "otp-req-email",
    key: email,
    maxRequests: 4,
    windowMs: 15 * 60 * 1000,
  });
  if (!emailLimit.allowed) {
    return secureJson(
      {
        error: `Too many verification emails sent to this address. Please wait ${emailLimit.retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(emailLimit.retryAfterSeconds) },
      }
    );
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return secureJson(
      { error: "An account with this email already exists. Please sign in." },
      { status: 409 }
    );
  }

  const passwordHash = hashPassword(password);
  const challenge = createOtpChallenge({ name, email, passwordHash });
  if (!challenge.ok) {
    return secureJson(
      {
        error: challenge.error,
        retryAfterSeconds: challenge.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  const mailResult = await sendOtpEmail({
    toEmail: email,
    recipientName: name,
    otpCode: challenge.otpCode,
    expiresMinutes: Math.round(challenge.expiresInSeconds / 60),
  });

  if (!mailResult.sent) {
    rollbackOtpChallenge(challenge.challengeId, email);
    return secureJson(
      {
        error:
          mailResult.error ||
          "Could not send verification email right now. Please try again.",
      },
      { status: 503 }
    );
  }

  return secureJson({
    challengeId: challenge.challengeId,
    maskedEmail: maskTargetEmail(email),
    expiresInSeconds: challenge.expiresInSeconds,
    resendAfterSeconds: challenge.resendAfterSeconds,
  });
}
