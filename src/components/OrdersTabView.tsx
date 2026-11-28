"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Compass,
  Download,
  Eye,
  FileText,
  IndianRupee,
  Layers,
  Loader2,
  MapPin,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Ruler,
  Send,
  Star,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppContext";
import { downloadOrderReceiptPdf } from "@/lib/receipt-pdf";
import type { OrderItem, OrderStatus } from "@/lib/types";

const STATUS_STYLE: Record<OrderStatus, string> = {
  Pending: "border-[#E6D5B8] bg-[#FDF7EC] text-[#9A5B13]",
  "In Review": "border-[#C7DBD1] bg-[#E8F2ED] text-[#0D5C43]",
  "In Progress": "border-[#C4D4E6] bg-[#EDF4FC] text-[#1D4E89]",
  "Revision Requested": "border-[#F1C59E] bg-[#FFF3E8] text-[#B45309]",
  Completed: "border-[#B4D8C6] bg-[#E1F3EA] text-[#0A573F]",
  Cancelled: "border-[#E6C7C2] bg-[#FCEEEA] text-[#9A3412]",
};

const PROGRESS_STEPS: OrderStatus[] = [
  "Pending",
  "In Review",
  "In Progress",
  "Completed",
];

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "PDF";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function OrdersTabView() {
  const prefersReducedMotion = useReducedMotion();
  const { orders, siteConfig, authFetch, refreshOrders, setActiveTab } =
    useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    title: string;
  } | null>(null);

  // Per-order review & revision local states
  const [openRevisionOrderId, setOpenRevisionOrderId] = useState<string | null>(
    null
  );
  const [revisionNote, setRevisionNote] = useState("");
  const [submittingRevisionId, setSubmittingRevisionId] = useState<
    string | null
  >(null);

  const [openReviewOrderId, setOpenReviewOrderId] = useState<string | null>(
    null
  );
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReviewId, setSubmittingReviewId] = useState<string | null>(
    null
  );
  const [feedbackBanner, setFeedbackBanner] = useState<{
    orderId: string;
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  const handleDownloadReceipt = async (order: OrderItem) => {
    setDownloadingId(order.id);
    try {
      await downloadOrderReceiptPdf(order, siteConfig);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSubmitRevision = async (orderId: string) => {
    if (revisionNote.trim().length < 5) {
      setFeedbackBanner({
        orderId,
        type: "err",
        text: "Please describe the changes you need (at least 5 characters).",
      });
      return;
    }
    setSubmittingRevisionId(orderId);
    setFeedbackBanner(null);
    try {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "revision",
          note: revisionNote.trim(),
        }),
      });
      const data = (await res.json()) as { order?: OrderItem; error?: string };
      if (!res.ok) {
        setFeedbackBanner({
          orderId,
          type: "err",
          text: data.error || "Could not submit revision request.",
        });
        return;
      }
      setRevisionNote("");
      setOpenRevisionOrderId(null);
      setFeedbackBanner({
        orderId,
        type: "ok",
        text: "Revision request sent to Akvai Associates. Our architect will upload revised drawings soon.",
      });
      await refreshOrders();
    } catch {
      setFeedbackBanner({
        orderId,
        type: "err",
        text: "Network error while sending revision request.",
      });
    } finally {
      setSubmittingRevisionId(null);
    }
  };

  const handleSubmitReview = async (orderId: string) => {
    if (reviewComment.trim().length < 3) {
      setFeedbackBanner({
        orderId,
        type: "err",
        text: "Please write a short review comment before submitting.",
      });
      return;
    }
    setSubmittingReviewId(orderId);
    setFeedbackBanner(null);
    try {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "review",
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });
      const data = (await res.json()) as { order?: OrderItem; error?: string };
      if (!res.ok) {
        setFeedbackBanner({
          orderId,
          type: "err",
          text: data.error || "Could not save review.",
        });
        return;
      }
      setReviewComment("");
      setOpenReviewOrderId(null);
      setFeedbackBanner({
        orderId,
        type: "ok",
        text: "Thank you for reviewing Akvai Associates!",
      });
      await refreshOrders();
    } catch {
      setFeedbackBanner({
        orderId,
        type: "err",
        text: "Network error while submitting review.",
      });
    } finally {
      setSubmittingReviewId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-144px)] bg-[#F4F1EA] pb-28">
      <section className="mx-auto max-w-5xl px-6 py-10 lg:py-14">
        <div className="flex flex-col justify-between gap-4 border-b border-[#DED9CE] pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
              PROJECT ORDERS &amp; DELIVERABLES
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-4xl">
              Track drawings, receipts &amp; revisions.
            </h1>
            <p className="mt-2 text-sm text-[#585651]">
              Download your Bill Receipt PDF anytime. Once our architect uploads
              your completed plans, download every PDF right here, submit a
              review, or request revisions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="inline-flex min-h-10 items-center gap-2 rounded-[3px] border border-[#D4CFC4] bg-white px-4 py-2 text-xs font-semibold text-[#2A2926] transition-colors hover:bg-[#FAF9F5] disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
            <motion.button
              type="button"
              onClick={() => setActiveTab("service")}
              whileHover={prefersReducedMotion ? undefined : { y: -1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className="inline-flex min-h-10 items-center gap-2 rounded-[3px] bg-[#E07A22] px-4 py-2 text-xs font-semibold text-[#1A1918] transition-colors hover:bg-[#CF6C18]"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Book New Service</span>
            </motion.button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="mt-10 border border-[#E4E0D7] bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[4px] bg-[#E5EFEA] text-[#0D5C43]">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-semibold text-[#1C1B19]">
              No architectural orders yet.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#585651]">
              Head to the Services page to book a 2D Layout Plan, Architecture,
              Interior Design, or 3D Visualization brief.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("service")}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[3px] bg-[#0D5C43] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#094734]"
            >
              <Layers className="h-4 w-4" />
              <span>Open Services Page</span>
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((order) => {
              const stepIdx =
                order.status === "Revision Requested"
                  ? 2
                  : PROGRESS_STEPS.indexOf(order.status);
              const canReviewOrRevise =
                order.status === "Completed" || order.deliverables.length > 0;

              return (
                <motion.article
                  key={order.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-[#DFDBD0] bg-white p-6 shadow-[0_8px_24px_-18px_rgba(24,28,26,0.18)] sm:p-7"
                >
                  {/* Top Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0D5C43]">
                          {order.id}
                        </span>
                        <span className="text-[#CBC5B8]">·</span>
                        <span className="font-mono text-xs text-[#585651]">
                          {order.invoiceNumber}
                        </span>
                        <span className="text-[#CBC5B8]">·</span>
                        <span className="inline-flex items-center gap-1 text-xs text-[#6B6963]">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h2 className="mt-1.5 font-serif text-2xl font-bold text-[#1C1B19]">
                        {order.serviceTitle}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-[3px] border px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLE[order.status] || STATUS_STYLE.Pending
                        }`}
                      >
                        {order.status}
                      </span>
                      <button
                        type="button"
                        disabled={downloadingId === order.id}
                        onClick={() => void handleDownloadReceipt(order)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-[3px] border border-[#0D5C43] bg-[#E5EFEA] px-3.5 py-1.5 text-xs font-semibold text-[#0D5C43] transition-colors hover:bg-[#0D5C43] hover:text-white disabled:opacity-60"
                      >
                        {downloadingId === order.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        <span>Bill Receipt PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment & Quick Meta Strip */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-[#F0ECE4] py-3 text-xs text-[#4B4A46]">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#1C1B19]">
                      <IndianRupee className="h-3.5 w-3.5 text-[#DF7324]" />
                      <span>
                        ₹{order.payment.amountInr.toLocaleString("en-IN")}
                      </span>
                      <span className="font-normal text-[#6B6963]">
                        ({order.payment.method} · {order.payment.status})
                      </span>
                    </span>
                    {order.payment.referenceId && (
                      <span className="font-mono text-[11px] text-[#585651]">
                        Ref: {order.payment.referenceId}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#0D5C43]" />
                      <span>{order.location || "Not specified"}</span>
                    </span>
                  </div>

                  {/* Plot Dimensions & Sketch Summary */}
                  {order.plotDetails && (
                    <div className="mt-4 flex flex-col justify-between gap-4 border border-[#E5E1D8] bg-[#FAF9F5] p-4 sm:flex-row sm:items-center">
                      <div className="space-y-1.5 text-xs">
                        <p className="font-semibold tracking-[0.06em] text-[#0D5C43]">
                          PLOT SPECIFICATIONS
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#2A2926]">
                          {order.plotDetails.length && order.plotDetails.width && (
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <Ruler className="h-3.5 w-3.5 text-[#DF7324]" />
                              {order.plotDetails.length} ×{" "}
                              {order.plotDetails.width} {order.plotDetails.unit}
                              {order.plotDetails.areaSq
                                ? ` (${order.plotDetails.areaSq})`
                                : ""}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Compass className="h-3.5 w-3.5 text-[#0D5C43]" />
                            North: <strong>{order.plotDetails.northSide}</strong>
                          </span>
                          <span>
                            Floors: <strong>{order.plotDetails.floors}</strong>
                          </span>
                        </div>
                      </div>

                      {order.plotDetails.sketchImageDataUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              src: order.plotDetails!.sketchImageDataUrl!,
                              title:
                                order.plotDetails!.sketchFileName ||
                                `${order.id} Plot Sketch`,
                            })
                          }
                          className="inline-flex items-center gap-2 self-start rounded-[3px] border border-[#D4CFC4] bg-white px-3 py-1.5 text-xs font-semibold text-[#1C1B19] hover:border-[#0D5C43] sm:self-auto"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={order.plotDetails.sketchImageDataUrl}
                            alt="Plot sketch thumbnail"
                            className="h-8 w-8 rounded-[2px] object-cover"
                          />
                          <Eye className="h-3.5 w-3.5 text-[#0D5C43]" />
                          <span>View Sketch</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Requirement Brief */}
                  <p className="mt-4 text-sm leading-relaxed text-[#454440]">
                    {order.message}
                  </p>

                  {/* Progress Stepper */}
                  {order.status !== "Cancelled" && (
                    <div className="mt-5">
                      <div className="grid grid-cols-4 gap-2">
                        {PROGRESS_STEPS.map((label, idx) => {
                          const completed = stepIdx >= idx;
                          return (
                            <div key={label} className="space-y-1.5">
                              <div
                                className={`h-1.5 w-full rounded-[2px] ${
                                  completed ? "bg-[#0D5C43]" : "bg-[#E9E5DB]"
                                }`}
                              />
                              <p
                                className={`text-[11px] font-medium ${
                                  completed
                                    ? "text-[#0D5C43]"
                                    : "text-[#8C8A84]"
                                }`}
                              >
                                {label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      {order.status === "Revision Requested" && (
                        <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-[#B45309]">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>
                            Revision requested — our architect is updating your
                            drawings.
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Studio / Architect Note */}
                  {order.adminNote && (
                    <div className="mt-4 flex items-start gap-2.5 border-l-2 border-[#0D5C43] bg-[#F5F8F6] px-4 py-3 text-xs text-[#2E3833]">
                      <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#0D5C43]" />
                      <div>
                        <p className="font-semibold text-[#0D5C43]">
                          Note from Akvai Associates
                        </p>
                        <p className="mt-0.5 leading-relaxed">
                          {order.adminNote}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Final Delivered PDFs from Owner */}
                  {order.deliverables.length > 0 && (
                    <div className="mt-5 border border-[#B4D8C6] bg-[#EEF7F2] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.06em] text-[#0A573F]">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            READY FOR DOWNLOAD · {order.deliverables.length}{" "}
                            ARCHITECTURAL PDF
                            {order.deliverables.length > 1 ? "S" : ""}
                          </span>
                        </p>
                      </div>
                      <div className="mt-3 space-y-2">
                        {order.deliverables.map((pdf) => (
                          <div
                            key={pdf.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-[#CFE5DA] bg-white px-3.5 py-2.5"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <FileText className="h-4 w-4 shrink-0 text-[#DF7324]" />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-[#1C1B19]">
                                  {pdf.fileName}
                                </p>
                                <p className="text-[11px] text-[#6B6963]">
                                  {formatBytes(pdf.fileSizeBytes)} · Uploaded{" "}
                                  {new Date(pdf.uploadedAt).toLocaleDateString(
                                    "en-IN"
                                  )}
                                  {pdf.note ? ` · ${pdf.note}` : ""}
                                </p>
                              </div>
                            </div>
                            <a
                              href={pdf.pdfDataUrl}
                              download={pdf.fileName}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-[3px] bg-[#0D5C43] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#094734]"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Download PDF</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past Revisions List */}
                  {order.revisions.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-[#F0ECE4] pt-4">
                      <p className="text-[11px] font-semibold tracking-[0.08em] text-[#6B6963]">
                        REVISION HISTORY
                      </p>
                      {order.revisions.map((rev) => (
                        <div
                          key={rev.id}
                          className="flex items-start justify-between gap-3 rounded-[3px] border border-[#EFEAE0] bg-[#FAF9F5] px-3.5 py-2.5 text-xs"
                        >
                          <div>
                            <p className="font-medium text-[#2A2926]">
                              {rev.note}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#7A7872]">
                              {new Date(rev.createdAt).toLocaleDateString(
                                "en-IN"
                              )}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-[2px] px-2 py-0.5 text-[10px] font-semibold ${
                              rev.resolved
                                ? "bg-[#E1F3EA] text-[#0A573F]"
                                : "bg-[#FFF3E8] text-[#B45309]"
                            }`}
                          >
                            {rev.resolved ? "Updated" : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Saved Review Display */}
                  {order.review && (
                    <div className="mt-4 border border-[#E5E1D8] bg-[#FAF9F5] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#0D5C43]">
                          YOUR REVIEW
                        </p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`h-3.5 w-3.5 ${
                                n <= order.review!.rating
                                  ? "fill-[#E07A22] text-[#E07A22]"
                                  : "text-[#D4CFC4]"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#3C3B37]">
                        {order.review.comment}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons for Review & Revision */}
                  {canReviewOrRevise && (
                    <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-[#F0ECE4] pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenRevisionOrderId((cur) =>
                            cur === order.id ? null : order.id
                          );
                          setOpenReviewOrderId(null);
                          setFeedbackBanner(null);
                        }}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-[3px] border border-[#D8D3C8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1C1B19] hover:border-[#B45309] hover:text-[#B45309]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Request Revision</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenReviewOrderId((cur) =>
                            cur === order.id ? null : order.id
                          );
                          setOpenRevisionOrderId(null);
                          setReviewRating(order.review?.rating ?? 5);
                          setReviewComment(order.review?.comment ?? "");
                          setFeedbackBanner(null);
                        }}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-[3px] border border-[#E07A22] bg-[#FFF8F1] px-3.5 py-1.5 text-xs font-semibold text-[#9A3412] hover:bg-[#E07A22] hover:text-[#1A1918]"
                      >
                        <Star className="h-3.5 w-3.5" />
                        <span>
                          {order.review ? "Edit Review" : "Leave a Review"}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Feedback Banner */}
                  {feedbackBanner && feedbackBanner.orderId === order.id && (
                    <p
                      className={`mt-3 rounded-[3px] px-3.5 py-2 text-xs font-medium ${
                        feedbackBanner.type === "ok"
                          ? "border border-[#C6DCD1] bg-[#E5EFEA] text-[#0D5C43]"
                          : "border border-[#E9C4B8] bg-[#FDF2EE] text-[#9A3412]"
                      }`}
                    >
                      {feedbackBanner.text}
                    </p>
                  )}

                  {/* Inline Revision Form */}
                  {openRevisionOrderId === order.id && (
                    <div className="mt-4 space-y-3 border border-[#F1C59E] bg-[#FFF8F1] p-4">
                      <label className="block text-xs font-semibold text-[#9A3412]">
                        Describe Revision Changes Needed
                      </label>
                      <textarea
                        rows={3}
                        value={revisionNote}
                        onChange={(e) => setRevisionNote(e.target.value)}
                        placeholder="e.g. Shift kitchen door towards dining area and increase master bedroom width by 1 ft..."
                        className="w-full rounded-[3px] border border-[#E5C9AC] bg-white px-3 py-2 text-xs text-[#1C1B19] focus:border-[#E07A22] focus:outline-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setOpenRevisionOrderId(null)}
                          className="rounded-[3px] px-3 py-1.5 text-xs font-medium text-[#585651]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submittingRevisionId === order.id}
                          onClick={() => void handleSubmitRevision(order.id)}
                          className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#E07A22] px-4 py-1.5 text-xs font-semibold text-[#1A1918] hover:bg-[#CF6C18] disabled:opacity-60"
                        >
                          {submittingRevisionId === order.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          <span>Send Revision Request</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Review Form */}
                  {openReviewOrderId === order.id && (
                    <div className="mt-4 space-y-3 border border-[#D8D3C8] bg-[#FAF9F5] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#1C1B19]">
                          Rate Your Experience with Akvai Associates
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              aria-label={`Rate ${star} stars`}
                              className="p-0.5"
                            >
                              <Star
                                className={`h-5 w-5 transition-colors ${
                                  star <= reviewRating
                                    ? "fill-[#E07A22] text-[#E07A22]"
                                    : "text-[#CBC5B8]"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your feedback on the architectural layout, responsiveness, and design quality..."
                        className="w-full rounded-[3px] border border-[#D8D3C8] bg-white px-3 py-2 text-xs text-[#1C1B19] focus:border-[#0D5C43] focus:outline-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setOpenReviewOrderId(null)}
                          className="rounded-[3px] px-3 py-1.5 text-xs font-medium text-[#585651]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submittingReviewId === order.id}
                          onClick={() => void handleSubmitReview(order.id)}
                          className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#0D5C43] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#094734] disabled:opacity-60"
                        >
                          {submittingReviewId === order.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          <span>Submit Review</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      {/* Plot Sketch Lightbox */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[88vh] max-w-3xl overflow-hidden rounded-[4px] bg-white p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-4 px-1">
                <p className="truncate text-xs font-semibold text-[#1C1B19]">
                  {previewImage.title}
                </p>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] text-[#585651] hover:bg-[#F4F1EA]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.src}
                alt={previewImage.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
