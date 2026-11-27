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
} from "@/lib/store";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const email =
    typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  // Env ADMIN_PASSWORD override always takes precedence for configured ADMIN_EMAIL
  if (hasEnvAdminConfigured() && email === getEnvAdminEmail()) {
    const envPass = process.env.ADMIN_PASSWORD!.trim();
    if (!safeEqualStrings(password, envPass)) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    let adminUser = await findUserByEmail(email);
    if (!adminUser) {
      const created = await createUser({
        name: "Akvai Admin",
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

  const storedUser = await findUserByEmail(email);
  if (!storedUser || !verifyPassword(password, storedUser.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const publicUser = {
    id: storedUser.id,
    name: storedUser.name,
    email: storedUser.email,
    role: storedUser.role,
    createdAt: storedUser.createdAt,
  };
  const token = signSessionToken(publicUser);
  return NextResponse.json({ user: publicUser, token });
}
