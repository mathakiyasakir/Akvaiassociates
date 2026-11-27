import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteUserById, listPublicUsers, updateUserRole } from "@/lib/store";
import type { UserRole } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const users = await listPublicUsers();
  return NextResponse.json({ users });
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
  const userId = typeof record.userId === "string" ? record.userId.trim() : "";
  const role = record.role === "admin" || record.role === "user" ? (record.role as UserRole) : null;

  if (!userId || !role) {
    return NextResponse.json({ error: "Valid userId and role are required." }, { status: 400 });
  }

  if (userId === auth.user.id && role !== "admin") {
    return NextResponse.json(
      { error: "You cannot remove your own admin access." },
      { status: 400 }
    );
  }

  const updated = await updateUserRole(userId, role);
  if (!updated) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user: updated });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const userId = request.nextUrl.searchParams.get("userId")?.trim() || "";
  if (!userId) {
    return NextResponse.json({ error: "userId query parameter is required." }, { status: 400 });
  }
  if (userId === auth.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your currently signed-in admin account." },
      { status: 400 }
    );
  }

  await deleteUserById(userId);
  return NextResponse.json({ deleted: true, userId });
}
