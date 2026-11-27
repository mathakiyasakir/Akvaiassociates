import { NextRequest, NextResponse } from "next/server";
import { hashPassword, signSessionToken } from "@/lib/auth";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  if (!slugCheck.allowed || slugCheck.mode !== "setup") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const canSetup = await isFirstRunSetupRequired();
  if (!canSetup) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const name = typeof record.name === "string" ? record.name.trim() : "";
  const email =
    typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const password = typeof record.password === "string" ? record.password : "";
  const customSlugInput =
    typeof record.customSlug === "string" ? record.customSlug.trim() : "";

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "Please enter a full name (2 to 80 characters)." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid owner email address." },
      { status: 400 }
    );
  }
  if (password.length < 6 || password.length > 128) {
    return NextResponse.json(
      { error: "Password must be between 6 and 128 characters." },
      { status: 400 }
    );
  }

  let activeSlug: string;
  if (isEnvSlugConfigured()) {
    activeSlug = (await getConfiguredAdminSlug())!;
  } else {
    const slugValidation = validateCustomSlug(customSlugInput);
    if (!slugValidation.valid || !slugValidation.normalized) {
      return NextResponse.json(
        { error: slugValidation.error || "Please choose a valid secret URL slug." },
        { status: 400 }
      );
    }
    activeSlug = await saveCustomAdminSlug(slugValidation.normalized);
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const user = await createUser({
    name,
    email,
    passwordHash: hashPassword(password),
    role: "admin",
  });

  const token = signSessionToken(user);
  return NextResponse.json(
    {
      user,
      token,
      portalSlug: activeSlug,
      portalPath: `/portal/${activeSlug}`,
    },
    { status: 201 }
  );
}
