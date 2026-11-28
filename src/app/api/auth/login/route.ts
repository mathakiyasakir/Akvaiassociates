import { NextRequest } from "next/server";
import {
  attachSessionCookie,
  hashPassword,
  safeEqualStrings,
  signSessionToken,
  verifyPassword,
} from "@/lib/auth";
import {
  checkRateLimit,
  getClientIp,
  hasUnsafeKeys,
  secureJson,
  verifyLoginIntentToken,
  verifySameOrigin,
} from "@/lib/security";
import {
  ensureDemoTestUser,
  findUserByEmail,
  getDemoTestUserPassword,
  isDemoTesterEmail,
} from "@/lib/store";

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
    bucket: "login-ip",
    key: ip,
    maxRequests: 15,
    windowMs: 15 * 60 * 1000,
  });
  if (!ipLimit.allowed) {
    return secureJson(
      {
        error: `Too many sign-in attempts. Please try again in ${ipLimit.retryAfterSeconds}s.`,
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
  const email =
    typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (!email || !password) {
    return secureJson(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const emailLimit = checkRateLimit({
    bucket: "login-email",
    key: email,
    maxRequests: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!emailLimit.allowed) {
    return secureJson(
      {
        error: `Account temporarily locked due to failed attempts. Try again in ${emailLimit.retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(emailLimit.retryAfterSeconds) },
      }
    );
  }

  const isDemoAccount = isDemoTesterEmail(email);
  let storedUser = await findUserByEmail(email);

  if (isDemoAccount) {
    const demoPassword = getDemoTestUserPassword();
    const matchesDemoPass = safeEqualStrings(password, demoPassword);
    if (!storedUser) {
      if (!matchesDemoPass) {
        return secureJson(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }
      storedUser = await ensureDemoTestUser(hashPassword(demoPassword));
    } else if (
      !matchesDemoPass &&
      !verifyPassword(password, storedUser.passwordHash)
    ) {
      return secureJson(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }
  } else if (!storedUser || !verifyPassword(password, storedUser.passwordHash)) {
    return secureJson(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  // Prevent owner admin accounts from authenticating via public login form
  if (storedUser.role === "admin") {
    return secureJson(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const publicUser = {
    id: storedUser.id,
    name: storedUser.name,
    email: storedUser.email,
    role: storedUser.role,
    emailVerified: storedUser.emailVerified,
    isDemoTester: isDemoAccount,
    createdAt: storedUser.createdAt,
  };
  const token = signSessionToken(publicUser);
  return attachSessionCookie(secureJson({ user: publicUser, token }), token, request);
}
