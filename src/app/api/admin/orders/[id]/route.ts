import crypto from "crypto";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sanitizePdfDataUrl } from "@/lib/default-data";
import { hasUnsafeKeys, secureJson, verifySameOrigin } from "@/lib/security";
import { deleteOrderById, updateOrderAdmin } from "@/lib/store";
import type {
  OrderDeliverablePdf,
  OrderStatus,
  PaymentStatus,
} from "@/lib/types";

const ALLOWED_STATUSES = new Set<OrderStatus>([
  "Pending",
  "In Review",
  "In Progress",
  "Revision Requested",
  "Completed",
  "Cancelled",
]);

const ALLOWED_PAYMENT_STATUSES = new Set<PaymentStatus>([
  "Paid",
  "Verification Pending",
  "Unpaid",
]);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!verifySameOrigin(request)) {
    return secureJson({ error: "Forbidden request origin." }, { status: 403 });
  }

  const auth = await requireAdmin(request);
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

  const record = body as Record<string, unknown>;
  const updates: {
    status?: OrderStatus;
    adminNote?: string;
    paymentStatus?: PaymentStatus;
    addDeliverables?: OrderDeliverablePdf[];
    removeDeliverableId?: string;
    markRevisionsResolved?: boolean;
  } = {};

  if (record.status !== undefined) {
    if (
      typeof record.status !== "string" ||
      !ALLOWED_STATUSES.has(record.status as OrderStatus)
    ) {
      return secureJson({ error: "Invalid order status." }, { status: 400 });
    }
    updates.status = record.status as OrderStatus;
  }

  if (record.paymentStatus !== undefined) {
    if (
      typeof record.paymentStatus !== "string" ||
      !ALLOWED_PAYMENT_STATUSES.has(record.paymentStatus as PaymentStatus)
    ) {
      return secureJson({ error: "Invalid payment status." }, { status: 400 });
    }
    updates.paymentStatus = record.paymentStatus as PaymentStatus;
  }

  if (record.adminNote !== undefined) {
    if (typeof record.adminNote !== "string") {
      return secureJson({ error: "Invalid architect note." }, { status: 400 });
    }
    updates.adminNote = record.adminNote.trim().slice(0, 800);
  }

  if (
    typeof record.removeDeliverableId === "string" &&
    record.removeDeliverableId.trim()
  ) {
    updates.removeDeliverableId = record.removeDeliverableId.trim().slice(0, 64);
  }

  if (Array.isArray(record.addDeliverables) && record.addDeliverables.length > 0) {
    const validatedDeliverables: OrderDeliverablePdf[] = [];
    for (const item of record.addDeliverables.slice(0, 5)) {
      if (!item || typeof item !== "object") continue;
      const d = item as Record<string, unknown>;
      const checkedPdf = sanitizePdfDataUrl(d.pdfDataUrl, 4_500_000);
      if (!checkedPdf) {
        return secureJson(
          {
            error:
              "Every deliverable must be a valid PDF file (max 4.5 MB per PDF).",
          },
          { status: 400 }
        );
      }

      const rawName =
        typeof d.fileName === "string" && d.fileName.trim()
          ? d.fileName.trim()
          : "Akvai_Architectural_Plan.pdf";
      const safeName = rawName
        .replace(/[^a-zA-Z0-9._ -]/g, "_")
        .slice(0, 90);
      const finalName = safeName.toLowerCase().endsWith(".pdf")
        ? safeName
        : `${safeName}.pdf`;

      validatedDeliverables.push({
        id: `DEL-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        fileName: finalName,
        fileSizeBytes: checkedPdf.sizeBytes,
        pdfDataUrl: checkedPdf.dataUrl,
        uploadedAt: new Date().toISOString(),
        note:
          typeof d.note === "string" ? d.note.trim().slice(0, 200) : undefined,
      });
    }

    if (validatedDeliverables.length > 0) {
      updates.addDeliverables = validatedDeliverables;
    }
  }

  if (record.markCompleteWithDeliverables === true) {
    updates.status = "Completed";
    updates.markRevisionsResolved = true;
  } else if (record.markRevisionsResolved === true) {
    updates.markRevisionsResolved = true;
  }

  const updated = await updateOrderAdmin(id, updates);
  if (!updated) {
    return secureJson({ error: "Order not found." }, { status: 404 });
  }

  return secureJson({ order: updated });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!verifySameOrigin(request)) {
    return secureJson({ error: "Forbidden request origin." }, { status: 403 });
  }

  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const deleted = await deleteOrderById(id);
  if (!deleted) {
    return secureJson({ error: "Order not found." }, { status: 404 });
  }

  return secureJson({ deleted: true, id });
}
