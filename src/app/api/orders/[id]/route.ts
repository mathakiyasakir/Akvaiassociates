import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { hasUnsafeKeys, secureJson, verifySameOrigin } from "@/lib/security";
import {
  findOrderById,
  requestOrderRevision,
  submitOrderReview,
} from "@/lib/store";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!verifySameOrigin(request)) {
    return secureJson({ error: "Forbidden request origin." }, { status: 403 });
  }

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!id || id.length > 64) {
    return secureJson({ error: "Invalid order ID." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureJson({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || hasUnsafeKeys(body)) {
    return secureJson({ error: "Invalid input payload." }, { status: 400 });
  }

  const existing = await findOrderById(id);
  if (!existing) {
    return secureJson({ error: "Order not found." }, { status: 404 });
  }
  if (existing.userId !== auth.user.id) {
    return secureJson(
      { error: "You are not authorized to update this order." },
      { status: 403 }
    );
  }

  const record = body as Record<string, unknown>;
  const action = typeof record.action === "string" ? record.action : "";

  if (action === "review") {
    if (existing.status !== "Completed" && existing.deliverables.length === 0) {
      return secureJson(
        { error: "Reviews can be submitted once architectural PDFs are delivered." },
        { status: 400 }
      );
    }
    const rating = Number(record.rating);
    const comment = typeof record.comment === "string" ? record.comment.trim() : "";
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return secureJson(
        { error: "Please select a star rating from 1 to 5." },
        { status: 400 }
      );
    }
    if (comment.length < 3 || comment.length > 800) {
      return secureJson(
        { error: "Please write a brief review (3 to 800 characters)." },
        { status: 400 }
      );
    }

    const updated = await submitOrderReview(id, auth.user.id, rating, comment);
    if (!updated) {
      return secureJson({ error: "Unable to save review." }, { status: 400 });
    }
    return secureJson({ order: updated });
  }

  if (action === "revision") {
    if (existing.status === "Cancelled") {
      return secureJson(
        { error: "Cannot request revision on a cancelled order." },
        { status: 400 }
      );
    }
    const note = typeof record.note === "string" ? record.note.trim() : "";
    if (note.length < 5 || note.length > 1000) {
      return secureJson(
        { error: "Please describe the revision changes needed (5 to 1000 characters)." },
        { status: 400 }
      );
    }

    const updated = await requestOrderRevision(id, auth.user.id, note);
    if (!updated) {
      return secureJson(
        { error: "Unable to submit revision request." },
        { status: 400 }
      );
    }
    return secureJson({ order: updated });
  }

  return secureJson({ error: "Unsupported order action." }, { status: 400 });
}
