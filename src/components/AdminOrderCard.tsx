"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Compass,
  Download,
  FilePlus2,
  FileText,
  IndianRupee,
  Loader2,
  Ruler,
  Save,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { downloadOrderReceiptPdf } from "@/lib/receipt-pdf";
import type {
  OrderItem,
  OrderStatus,
  PaymentStatus,
  SiteConfig,
} from "@/lib/types";

export interface AdminOrderPatchPayload {
  status?: OrderStatus;
  adminNote?: string;
  paymentStatus?: PaymentStatus;
  addDeliverables?: { fileName: string; pdfDataUrl: string; note?: string }[];
  removeDeliverableId?: string;
  markCompleteWithDeliverables?: boolean;
}

const ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "In Review",
  "In Progress",
  "Revision Requested",
  "Completed",
  "Cancelled",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "Paid",
  "Verification Pending",
  "Unpaid",
];

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "PDF";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminOrderCard({
  order,
  siteConfig,
  busy,
  onPatch,
  onDelete,
  notify,
}: {
  order: OrderItem;
  siteConfig: SiteConfig;
  busy: boolean;
  onPatch: (id: string, payload: AdminOrderPatchPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  notify: (type: "ok" | "err", text: string) => void;
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    order.payment.status
  );
  const [note, setNote] = useState(order.adminNote);
  const [queuedPdfs, setQueuedPdfs] = useState<
    { fileName: string; pdfDataUrl: string; sizeBytes: number }[]
  >([]);
  const [showSketchFull, setShowSketchFull] = useState(false);

  useEffect(() => {
    setStatus(order.status);
    setPaymentStatus(order.payment.status);
    setNote(order.adminNote);
  }, [order.status, order.payment.status, order.adminNote]);

  const handleSelectPdfs = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.slice(0, 5);
    validFiles.forEach((file) => {
      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        notify("err", `${file.name} is not a PDF file.`);
        return;
      }
      if (file.size > 4.2 * 1024 * 1024) {
        notify("err", `${file.name} exceeds 4.2 MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setQueuedPdfs((prev) => [
          ...prev,
          {
            fileName: file.name,
            pdfDataUrl: String(reader.result || ""),
            sizeBytes: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    event.target.value = "";
  };

  const handleUploadAndComplete = async () => {
    if (queuedPdfs.length === 0 && order.deliverables.length === 0) {
      notify(
        "err",
        "Please select at least 1 completed architectural PDF to deliver."
      );
      return;
    }
    await onPatch(order.id, {
      status: "Completed",
      paymentStatus,
      adminNote: note,
      addDeliverables: queuedPdfs.map((q) => ({
        fileName: q.fileName,
        pdfDataUrl: q.pdfDataUrl,
      })),
      markCompleteWithDeliverables: true,
    });
    setQueuedPdfs([]);
  };

  const handleSaveMeta = async () => {
    await onPatch(order.id, {
      status,
      paymentStatus,
      adminNote: note,
      ...(queuedPdfs.length > 0
        ? {
            addDeliverables: queuedPdfs.map((q) => ({
              fileName: q.fileName,
              pdfDataUrl: q.pdfDataUrl,
            })),
          }
        : {}),
    });
    setQueuedPdfs([]);
  };

  const pendingRevisions = order.revisions.filter((r) => !r.resolved);

  return (
    <div className="border border-[#DFDBD0] bg-white p-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#F0ECE4] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-semibold text-[#0D5C43]">
            <span>{order.id}</span>
            <span>·</span>
            <span>{order.invoiceNumber}</span>
            <span>·</span>
            <span>{order.projectType}</span>
          </div>
          <h3 className="mt-1 font-serif text-xl font-bold text-[#1C1B19]">
            {order.serviceTitle}
          </h3>
          <p className="mt-0.5 text-xs text-[#585651]">
            Client: <strong className="text-[#1C1B19]">{order.userName}</strong>{" "}
            ({order.userEmail}) · Site: {order.location}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void downloadOrderReceiptPdf(order, siteConfig)}
            className="inline-flex h-9 items-center gap-1.5 rounded-[3px] border border-[#0D5C43] bg-[#E5EFEA] px-3 text-xs font-semibold text-[#0D5C43] hover:bg-[#0D5C43] hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Receipt PDF</span>
          </button>
          <button
            type="button"
            onClick={() => void onDelete(order.id)}
            className="inline-flex h-9 items-center gap-1 rounded-[3px] px-2.5 text-xs font-medium text-[#9A3412] hover:bg-[#FDF2EE]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Payment Summary Strip */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[3px] border border-[#EFEAE0] bg-[#FAF9F5] px-4 py-2.5 text-xs">
        <span className="inline-flex items-center gap-1 font-bold text-[#1C1B19]">
          <IndianRupee className="h-3.5 w-3.5 text-[#DF7324]" />
          <span>₹{order.payment.amountInr.toLocaleString("en-IN")}</span>
        </span>
        <span className="text-[#4B4A46]">
          Method: <strong>{order.payment.method}</strong>
        </span>
        <span className="font-mono text-[#585651]">
          Ref/UTR: {order.payment.referenceId || "—"}
        </span>
        <span className="font-semibold text-[#0D5C43]">
          Payment: {order.payment.status}
        </span>
      </div>

      {/* Plot Dimensions & Sketch Photo */}
      {order.plotDetails && (
        <div className="mt-4 flex flex-col justify-between gap-4 border border-[#E5E1D8] bg-[#FAF9F5] p-4 sm:flex-row sm:items-center">
          <div className="space-y-1 text-xs">
            <p className="font-bold tracking-[0.06em] text-[#0D5C43]">
              CLIENT PLOT DIMENSIONS &amp; ORIENTATION
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#2A2926]">
              {order.plotDetails.length && order.plotDetails.width && (
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Ruler className="h-3.5 w-3.5 text-[#DF7324]" />
                  {order.plotDetails.length} × {order.plotDetails.width}{" "}
                  {order.plotDetails.unit}
                  {order.plotDetails.areaSq
                    ? ` (${order.plotDetails.areaSq})`
                    : ""}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Compass className="h-3.5 w-3.5 text-[#0D5C43]" />
                North Side: <strong>{order.plotDetails.northSide}</strong>
              </span>
              <span>
                Floors: <strong>{order.plotDetails.floors}</strong>
              </span>
            </div>
          </div>

          {order.plotDetails.sketchImageDataUrl && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSketchFull((p) => !p)}
                className="inline-flex items-center gap-2 rounded-[3px] border border-[#D4CFC4] bg-white px-3 py-1.5 text-xs font-semibold text-[#1C1B19] hover:border-[#0D5C43]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.plotDetails.sketchImageDataUrl}
                  alt="Client plot sketch"
                  className="h-8 w-8 rounded-[2px] object-cover"
                />
                <span>{showSketchFull ? "Hide Sketch" : "View Sketch"}</span>
              </button>
              <a
                href={order.plotDetails.sketchImageDataUrl}
                download={
                  order.plotDetails.sketchFileName || `${order.id}_sketch.png`
                }
                className="inline-flex h-10 items-center gap-1 rounded-[3px] border border-[#D4CFC4] bg-white px-2.5 text-xs font-semibold text-[#0D5C43] hover:bg-[#E5EFEA]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save</span>
              </a>
            </div>
          )}
        </div>
      )}

      {showSketchFull && order.plotDetails?.sketchImageDataUrl && (
        <div className="mt-3 border border-[#D8D3C8] bg-[#FAF9F5] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.plotDetails.sketchImageDataUrl}
            alt="Full client plot sketch"
            className="mx-auto max-h-96 w-auto rounded-[2px] border border-[#E5E1D8] bg-white object-contain"
          />
        </div>
      )}

      {/* Client Requirement Brief */}
      <div className="mt-4">
        <p className="text-[11px] font-semibold tracking-[0.06em] text-[#6B6963]">
          CLIENT REQUIREMENTS
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[#2A2926]">
          {order.message}
        </p>
      </div>

      {/* Pending Revision Requests from Client */}
      {pendingRevisions.length > 0 && (
        <div className="mt-4 space-y-2 border border-[#F1C59E] bg-[#FFF8F1] p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#B45309]">
            <AlertCircle className="h-4 w-4" />
            <span>
              CLIENT REVISION REQUESTED ({pendingRevisions.length})
            </span>
          </p>
          {pendingRevisions.map((rev) => (
            <p key={rev.id} className="text-xs leading-relaxed text-[#7C2D12]">
              • {rev.note}{" "}
              <span className="text-[10px] opacity-75">
                ({new Date(rev.createdAt).toLocaleDateString("en-IN")})
              </span>
            </p>
          ))}
        </div>
      )}

      {/* Client Review */}
      {order.review && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border border-[#E5E1D8] bg-[#FAF9F5] px-4 py-3 text-xs">
          <div>
            <p className="font-semibold text-[#0D5C43]">Client Review</p>
            <p className="mt-0.5 text-[#3C3B37]">{order.review.comment}</p>
          </div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-4 w-4 ${
                  n <= order.review!.rating
                    ? "fill-[#E07A22] text-[#E07A22]"
                    : "text-[#D4CFC4]"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Multi-PDF Final Architectural Deliverables */}
      <div className="mt-5 border border-[#C6DCD1] bg-[#F5FAF7] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.06em] text-[#0D5C43]">
              <FilePlus2 className="h-4 w-4" />
              <span>
                UPLOAD COMPLETED ARCHITECTURAL PDFs (1, 2 OR MORE)
              </span>
            </p>
            <p className="mt-0.5 text-[11px] text-[#4B4A46]">
              Attach your finished 2D layout / drawings PDFs and click
              &ldquo;Submit PDFs &amp; Mark Complete&rdquo; so the client can download
              them immediately.
            </p>
          </div>

          <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-[3px] border border-[#0D5C43] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0D5C43] hover:bg-[#E5EFEA]">
            <Upload className="h-3.5 w-3.5" />
            <span>Select PDF Files</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={handleSelectPdfs}
              className="hidden"
            />
          </label>
        </div>

        {/* Queued PDFs waiting to submit */}
        {queuedPdfs.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-[#B45309]">
              Ready to upload ({queuedPdfs.length}):
            </p>
            {queuedPdfs.map((pdf, idx) => (
              <div
                key={`${pdf.fileName}-${idx}`}
                className="flex items-center justify-between gap-2 rounded-[3px] border border-[#F1C59E] bg-white px-3 py-2 text-xs"
              >
                <span className="flex min-w-0 items-center gap-2 truncate font-medium text-[#1C1B19]">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-[#E07A22]" />
                  <span className="truncate">{pdf.fileName}</span>
                  <span className="text-[#6B6963]">
                    ({formatBytes(pdf.sizeBytes)})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQueuedPdfs((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="text-xs font-medium text-[#9A3412] hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Already Delivered PDFs */}
        {order.deliverables.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-[#0D5C43]">
              Delivered to client ({order.deliverables.length}):
            </p>
            {order.deliverables.map((pdf) => (
              <div
                key={pdf.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[3px] border border-[#CFE5DA] bg-white px-3 py-2 text-xs"
              >
                <span className="flex min-w-0 items-center gap-2 truncate font-medium text-[#1C1B19]">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-[#0D5C43]" />
                  <span className="truncate">{pdf.fileName}</span>
                  <span className="text-[#6B6963]">
                    ({formatBytes(pdf.fileSizeBytes)})
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={pdf.pdfDataUrl}
                    download={pdf.fileName}
                    className="font-semibold text-[#0D5C43] hover:underline"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void onPatch(order.id, { removeDeliverableId: pdf.id })
                    }
                    className="font-medium text-[#9A3412] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls Grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-[#F0ECE4] pt-4 md:grid-cols-12">
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-[#3C3B37]">
            Order Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
          >
            {ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-[#3C3B37]">
            Payment Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
          >
            {PAYMENT_STATUSES.map((ps) => (
              <option key={ps} value={ps}>
                {ps}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-6">
          <label className="block text-xs font-semibold text-[#3C3B37]">
            Architect Note (visible to client)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Uploaded 2D ground + first floor Vastu-aligned PDFs."
            className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 md:col-span-12">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSaveMeta()}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[3px] border border-[#0D5C43] bg-white px-4 py-2 text-xs font-semibold text-[#0D5C43] hover:bg-[#E5EFEA] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Save Status &amp; Note</span>
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => void handleUploadAndComplete()}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[3px] bg-[#E07A22] px-5 py-2 text-xs font-semibold text-[#1A1918] hover:bg-[#CF6C18] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>
              {queuedPdfs.length > 0
                ? `Submit ${queuedPdfs.length} PDF${queuedPdfs.length > 1 ? "s" : ""} & Mark Complete`
                : "Mark Order Completed"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
