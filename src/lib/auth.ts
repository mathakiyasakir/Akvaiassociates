import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { PublicUser, UserRole } from "@/lib/types";
import { findUserById, verifyPortalSlugAccess } from "@/lib/store";

const globalForAuth = globalThis as unknown as {
  __akvaiSessionSecret?: string;
};

function getSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }
  if (!globalForAuth.__akvaiSessionSecret) {
    globalForAuth.__akvaiSessionSecret = crypto.randomBytes(32).toString("hex");
  }
  return globalForAuth.__akvaiSessionSecret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }
  const [, salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, "hex");
  if (derived.length !== original.length) {
    return false;
  }
  return crypto.timingSafeEqual(derived, original);
}

export function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  exp: number;
}

export function signSessionToken(user: PublicUser): string {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 24,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): TokenPayload | null {
  if (!token || typeof token !== "string") return null;
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0) return null;
  const encoded = token.slice(0, dotIdx);
  const providedSig = token.slice(dotIdx + 1);
  if (!providedSig) return null;

  const expectedSig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");

  if (!safeEqualStrings(providedSig, expectedSig)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as TokenPayload;
    if (
      typeof parsed.sub !== "string" ||
      typeof parsed.email !== "string" ||
      (parsed.role !== "admin" && parsed.role !== "user") ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    if (Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<PublicUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const stored = await findUserById(payload.sub);
  if (!stored) return null;

  return {
    id: stored.id,
    name: stored.name,
    email: stored.email,
    role: stored.role,
    createdAt: stored.createdAt,
  };
}

export async function requireAuth(
  request: NextRequest
): Promise<{ user: PublicUser; error?: never } | { user?: never; error: NextResponse }> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      ),
    };
  }
  return { user };
}

export async function requireAdmin(
  request: NextRequest
): Promise<{ user: PublicUser; error?: never } | { user?: never; error: NextResponse }> {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult;
  if (authResult.user.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Not found." }, { status: 404 }),
    };
  }

  const portalKey = request.headers.get("x-admin-portal-key")?.trim() || "";
  if (portalKey) {
    const slugCheck = await verifyPortalSlugAccess(portalKey);
    if (!slugCheck.allowed) {
      return {
        error: NextResponse.json({ error: "Not found." }, { status: 404 }),
      };
    }
  }

  return { user: authResult.user };
}
