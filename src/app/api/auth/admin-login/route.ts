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
  verifySameOrigin,
} from "@/lib/security";
import {
  createUser,
  findUserByEmail,
  getEnvAdminEmail,
  hasEnvAdminConfigured,
  updateUserRole,
  verifyPortalSlugAccess,
} from "@/lib/store";

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return secureJson({ error: "Not found." }, { status: 404 });
  }

  const ip = getClientIp(request);
  const ipLimit = checkRateLimit({
    bucket: "admin-login-ip",
    key: ip,
    maxRequests: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!ipLimit.allowed) {
    return secureJson(
      { error: `Too many attempts. Try again in ${ipLimit.retryAfterSeconds}s.` },
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
    return secureJson({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || hasUnsafeKeys(body)) {
    return secureJson({ error: "Invalid input detected." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const portalKey =
    typeof record.portalKey === "string" ? record.portalKey.trim() : "";

  const slugCheck = await verifyPortalSlugAccess(portalKey);
  if (!slugCheck.allowed || slugCheck.mode !== "portal") {
    return secureJson({ error: "Not found." }, { status: 404 });
  }

  const email =
    typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (!email || !password) {
    return secureJson(
      { error: "Owner email and password are required." },
      { status: 400 }
    );
  }

  if (hasEnvAdminConfigured() && email === getEnvAdminEmail()) {
    const envPass = process.env.ADMIN_PASSWORD!.trim();
    if (!safeEqualStrings(password, envPass)) {
      return secureJson(
        { error: "Invalid owner credentials." },
        { status: 401 }
      );
    }

    let adminUser = await findUserByEmail(email);
    if (!adminUser) {
      const created = await createUser({
        name: "Akvai Owner",
        email,
        passwordHash: hashPassword(envPass),
        role: "admin",
        emailVerified: true,
      });
      const token = signSessionToken(created, portalKey);
      return attachSessionCookie(secureJson({ user: created, token }), token, request);
    }

    if (adminUser.role !== "admin") {
      await updateUserRole(adminUser.id, "admin");
      adminUser = { ...adminUser, role: "admin" };
    }

    const publicUser = {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      emailVerified: true,
      createdAt: adminUser.createdAt,
    };
    const token = signSessionToken(publicUser, portalKey);
    return attachSessionCookie(secureJson({ user: publicUser, token }), token, request);
  }

  const stored = await findUserByEmail(email);
  if (
    !stored ||
    stored.role !== "admin" ||
    !verifyPassword(password, stored.passwordHash)
  ) {
    return secureJson(
      { error: "Invalid owner credentials." },
      { status: 401 }
    );
  }

  const publicUser = {
    id: stored.id,
    name: stored.name,
    email: stored.email,
    role: stored.role,
    emailVerified: stored.emailVerified,
    createdAt: stored.createdAt,
  };
  const token = signSessionToken(publicUser, portalKey);
  return attachSessionCookie(secureJson({ user: publicUser, token }), token, request);
}
