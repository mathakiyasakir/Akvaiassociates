import { NextRequest } from "next/server";
import { hashPassword, signSessionToken } from "@/lib/auth";
import {
  checkRateLimit,
  getClientIp,
  hasUnsafeKeys,
  secureJson,
  validateStrongPassword,
  verifySameOrigin,
} from "@/lib/security";
import {
  createUser,
  findUserByEmail,
  getConfiguredAdminSlug,
  isEnvSlugConfigured,
  isFirstRunSetupRequired,
  saveCustomAdminSlug,
  validateCustomSlug,
  verifyPortalSlugAccess,
} from "@/lib/store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return secureJson({ error: "Not found." }, { status: 404 });
  }

  const ip = getClientIp(request);
  const ipLimit = checkRateLimit({
    bucket: "setup-admin-ip",
    key: ip,
    maxRequests: 6,
    windowMs: 15 * 60 * 1000,
  });
  if (!ipLimit.allowed) {
    return secureJson(
      { error: `Too many setup attempts. Try again in ${ipLimit.retryAfterSeconds}s.` },
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
  if (!slugCheck.allowed || slugCheck.mode !== "setup") {
    return secureJson({ error: "Not found." }, { status: 404 });
  }

  const canSetup = await isFirstRunSetupRequired();
  if (!canSetup) {
    return secureJson({ error: "Not found." }, { status: 404 });
  }

  const name = typeof record.name === "string" ? record.name.trim() : "";
  const email =
    typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const password = typeof record.password === "string" ? record.password : "";
  const customSlugInput =
    typeof record.customSlug === "string" ? record.customSlug.trim() : "";

  if (name.length < 2 || name.length > 80) {
    return secureJson(
      { error: "Please enter a full name (2 to 80 characters)." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return secureJson(
      { error: "Please enter a valid owner email address." },
      { status: 400 }
    );
  }

  const passCheck = validateStrongPassword(password);
  if (!passCheck.valid) {
    return secureJson(
      { error: passCheck.error || "Please choose a stronger owner password." },
      { status: 400 }
    );
  }

  let activeSlug: string;
  if (isEnvSlugConfigured()) {
    activeSlug = (await getConfiguredAdminSlug())!;
  } else {
    const slugValidation = validateCustomSlug(customSlugInput);
    if (!slugValidation.valid || !slugValidation.normalized) {
      return secureJson(
        { error: slugValidation.error || "Please choose a valid secret URL slug." },
        { status: 400 }
      );
    }
    activeSlug = await saveCustomAdminSlug(slugValidation.normalized);
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return secureJson(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const user = await createUser({
    name,
    email,
    passwordHash: hashPassword(password),
    role: "admin",
    emailVerified: true,
  });

  const token = signSessionToken(user, activeSlug);
  return secureJson(
    {
      user,
      token,
      portalSlug: activeSlug,
      portalPath: `/portal/${activeSlug}`,
    },
    { status: 201 }
  );
}
