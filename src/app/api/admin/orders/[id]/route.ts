import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteOrderById, updateOrderAdmin } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";

const ALLOWED_STATUSES = new Set<OrderStatus>([
  "Pending",
  "In Review",
  "In Progress",
  "Completed",
  "Cancelled",
]);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!id || id.length > 64) {
    return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const updates: { status?: OrderStatus; adminNote?: string } = {};

  if (record.status !== undefined) {
    if (
      typeof record.status !== "string" ||
      !ALLOWED_STATUSES.has(record.status as OrderStatus)
    ) {
      return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    }
    updates.status = record.status as OrderStatus;
  }

  if (record.adminNote !== undefined) {
    if (typeof record.adminNote !== "string") {
      return NextResponse.json({ error: "Invalid architect note." }, { status: 400 });
    }
    updates.adminNote = record.adminNote.trim().slice(0, 600);
  }

  const updated = await updateOrderAdmin(id, updates);
  if (!updated) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order: updated });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const deleted = await deleteOrderById(id);
  if (!deleted) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ deleted: true, id });
}
