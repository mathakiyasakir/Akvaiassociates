import { NextRequest, NextResponse } from "next/server";
import { hashPassword, requireAdmin, verifyPassword } from "@/lib/auth";
import {
  findUserById,
  getConfiguredAdminSlug,
  hasEnvAdminConfigured,
  isEnvSlugConfigured,
  saveCustomAdminSlug,
  updateUserPasswordHash,
} from "@/lib/store";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const activeSlug = (await getConfiguredAdminSlug()) || "";
  return NextResponse.json({
    security: {
      activeSlug,
      portalPath: `/portal/${activeSlug}`,
      slugControlledByEnv: isEnvSlugConfigured(),
      passwordControlledByEnv: hasEnvAdminConfigured(),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const action = typeof record.action === "string" ? record.action : "";

  if (action === "rotate-slug") {
    if (isEnvSlugConfigured()) {
      return NextResponse.json(
        {
          error:
            "Secret URL is locked by ADMIN_SECRET_SLUG environment variable. Update it in your Vercel Environment Variables.",
        },
        { status: 400 }
      );
    }
    const nextSlug = typeof record.newSlug === "string" ? record.newSlug : "";
    try {
      const saved = await saveCustomAdminSlug(nextSlug);
      return NextResponse.json({
        security: {
          activeSlug: saved,
          portalPath: `/portal/${saved}`,
          slugControlledByEnv: false,
          passwordControlledByEnv: hasEnvAdminConfigured(),
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid secret URL slug." },
        { status: 400 }
      );
    }
  }

  if (action === "change-password") {
    if (hasEnvAdminConfigured()) {
      return NextResponse.json(
        {
          error:
            "Owner password is set via ADMIN_PASSWORD environment variable. Update it in Vercel Environment Variables.",
        },
        { status: 400 }
      );
    }
    const currentPassword =
      typeof record.currentPassword === "string" ? record.currentPassword : "";
    const newPassword =
      typeof record.newPassword === "string" ? record.newPassword : "";

    if (newPassword.length < 6 || newPassword.length > 128) {
      return NextResponse.json(
        { error: "New password must be between 6 and 128 characters." },
        { status: 400 }
      );
    }

    const stored = await findUserById(auth.user.id);
    if (!stored || !verifyPassword(currentPassword, stored.passwordHash)) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    await updateUserPasswordHash(auth.user.id, hashPassword(newPassword));
    return NextResponse.json({ passwordUpdated: true });
  }

  return NextResponse.json({ error: "Unsupported security action." }, { status: 400 });
}
