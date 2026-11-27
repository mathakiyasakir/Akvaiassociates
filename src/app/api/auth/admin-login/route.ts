import { NextRequest, NextResponse } from "next/server";
import {
  hashPassword,
  safeEqualStrings,
  signSessionToken,
  verifyPassword,
} from "@/lib/auth";
import {
  createUser,
  findUserByEmail,
  getEnvAdminEmail,
  hasEnvAdminConfigured,
  updateUserRole,
  verifyPortalSlugAccess,
} from "@/lib/store";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const portalKey =
    typeof record.portalKey === "string" ? record.portalKey.trim() : "";

  const slugCheck = await verifyPortalSlugAccess(portalKey);
  if (!slugCheck.allowed || slugCheck.mode !== "portal") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const email =
    typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Owner email and password are required." },
      { status: 400 }
    );
  }

  if (hasEnvAdminConfigured() && email === getEnvAdminEmail()) {
    const envPass = process.env.ADMIN_PASSWORD!.trim();
    if (!safeEqualStrings(password, envPass)) {
      return NextResponse.json(
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
      });
      const token = signSessionToken(created);
      return NextResponse.json({ user: created, token });
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
      createdAt: adminUser.createdAt,
    };
    const token = signSessionToken(publicUser);
    return NextResponse.json({ user: publicUser, token });
  }

  const stored = await findUserByEmail(email);
  if (
    !stored ||
    stored.role !== "admin" ||
    !verifyPassword(password, stored.passwordHash)
  ) {
    return NextResponse.json(
      { error: "Invalid owner credentials." },
      { status: 401 }
    );
  }

  const publicUser = {
    id: stored.id,
    name: stored.name,
    email: stored.email,
    role: stored.role,
    createdAt: stored.createdAt,
  };
  const token = signSessionToken(publicUser);
  return NextResponse.json({ user: publicUser, token });
}
