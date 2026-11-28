"use client";

import { useState } from "react";
import {
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  ImagePlus,
  IndianRupee,
  Landmark,
  Loader2,
  QrCode,
  Receipt,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { downloadSampleReceiptPdf } from "@/lib/receipt-pdf";
import type {
  PaymentGatewayAdminStatus,
  ReceiptStyleMode,
  SiteConfig,
} from "@/lib/types";

interface AdminBillingGatewaysTabProps {
  draft: SiteConfig;
  setDraft: React.Dispatch<React.SetStateAction<SiteConfig>>;
  savingConfig: boolean;
  onSaveConfig: () => Promise<void>;
  gatewayStatus: PaymentGatewayAdminStatus | null;
  onSaveRazorpaySecret: (keyId: string, secret: string) => Promise<void>;
  onClearRazorpaySecret: () => Promise<void>;
  savingGateway: boolean;
  notify: (type: "ok" | "err", text: string) => void;
}

const RECEIPT_STYLES: {
  id: ReceiptStyleMode;
  label: string;
  desc: string;
}[] = [
  {
    id: "architectural",
    label: "Architectural Classic",
    desc: "Emerald & terracotta letterhead with your uploaded logo and clean invoice table.",
  },
  {
    id: "minimal",
    label: "Minimal Studio",
    desc: "Crisp monochrome architectural receipt with sharp lines and studio signature.",
  },
  {
    id: "custom-template",
    label: "Custom Uploaded Sample",
    desc: "Uses your uploaded receipt photo/template style and fills ONLY the client name, service, amount & invoice dynamically.",
  },
];

export function AdminBillingGatewaysTab({
  draft,
  setDraft,
  savingConfig,
  onSaveConfig,
  gatewayStatus,
  onSaveRazorpaySecret,
  onClearRazorpaySecret,
  savingGateway,
  notify,
}: AdminBillingGatewaysTabProps) {
  const [rzpSecretInput, setRzpSecretInput] = useState("");
  const [showRzpSecret, setShowRzpSecret] = useState(false);
  const [previewingPdf, setPreviewingPdf] = useState(false);

  const handleReceiptTemplateUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      notify("err", "Receipt sample must be a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > 2.8 * 1024 * 1024) {
      notify("err", "Receipt sample image must be under 2.8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((prev) => ({
        ...prev,
        billing: {
          ...prev.billing,
          receiptStyle: "custom-template",
          templateImageDataUrl: String(reader.result || ""),
        },
      }));
      notify(
        "ok",
        "Custom receipt sample loaded! Click Save Billing & Gateways to publish."
      );
    };
    reader.readAsDataURL(file);
  };

  const handleUpiQrUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      notify("err", "UPI QR code must be a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > 1.4 * 1024 * 1024) {
      notify("err", "UPI QR code image must be under 1.4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((prev) => ({
        ...prev,
        payment: {
          ...prev.payment,
          upiQrDataUrl: String(reader.result || ""),
        },
      }));
      notify("ok", "UPI QR image attached. Click Save to apply live.");
    };
    reader.readAsDataURL(file);
  };

  const handlePreviewSamplePdf = async () => {
    setPreviewingPdf(true);
    try {
      await downloadSampleReceiptPdf(draft);
      notify("ok", "Sample Bill Receipt PDF generated for preview.");
    } finally {
      setPreviewingPdf(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-[#E4E0D7] bg-white p-6">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-[#0D5C43]">
            <Receipt className="h-4 w-4" />
            <span>BILL RECEIPTS &amp; PAYMENT GATEWAYS</span>
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-[#1C1B19]">
            Customize Bill Receipt Design &amp; Payment Options
          </h2>
          <p className="mt-1 text-xs text-[#6B6963]">
            Upload your own receipt sample photo or choose an architectural
            style, and control UPI, Razorpay, Bank Transfer, and Pay-on-Confirmation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={previewingPdf}
            onClick={() => void handlePreviewSamplePdf()}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[3px] border border-[#0D5C43] bg-white px-4 py-2 text-xs font-semibold text-[#0D5C43] hover:bg-[#E5EFEA] disabled:opacity-60"
          >
            {previewingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Preview Sample Receipt PDF</span>
          </button>

          <button
            type="button"
            disabled={savingConfig}
            onClick={() => void onSaveConfig()}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[3px] bg-[#0D5C43] px-5 py-2 text-xs font-semibold text-white hover:bg-[#094734] disabled:opacity-60"
          >
            {savingConfig ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save Billing &amp; Gateways</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: BILL RECEIPT STYLE & CUSTOM SAMPLE UPLOAD */}
      <div className="border border-[#E4E0D7] bg-white p-6 sm:p-8">
        <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-[#1C1B19]">
          <FileText className="h-5 w-5 text-[#0D5C43]" />
          <span>Bill Receipt Style &amp; Custom Sample Template</span>
        </h3>
        <p className="mt-1 text-xs text-[#585651]">
          Every order receipt automatically fills the logged-in client&apos;s name,
          service booked, plot size, amount paid, and invoice number.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {RECEIPT_STYLES.map((st) => {
            const active = draft.billing.receiptStyle === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    billing: { ...p.billing, receiptStyle: st.id },
                  }))
                }
                className={`flex flex-col items-start rounded-[3px] border p-4 text-left transition-colors ${
                  active
                    ? "border-[#0D5C43] bg-[#E5EFEA]"
                    : "border-[#DDD8CE] bg-[#FAF9F5] hover:border-[#0D5C43]"
                }`}
              >
                <span className="text-sm font-bold text-[#1C1B19]">
                  {st.label}
                </span>
                <span className="mt-1 text-xs leading-relaxed text-[#585651]">
                  {st.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Receipt Sample Image Uploader */}
        <div className="mt-5 border border-[#E5E1D8] bg-[#FAF9F5] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#1C1B19]">
                Upload Your Own Bill Receipt Sample Image (A4 / Letterhead Photo)
              </p>
              <p className="mt-0.5 text-[11px] text-[#6B6963]">
                Upload a clean PNG/JPG letterhead or sample bill background. When
                &ldquo;Custom Uploaded Sample&rdquo; is selected, client name, service &amp;
                amount overlay neatly onto your exact template style.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-[3px] bg-[#E07A22] px-3.5 py-1.5 text-xs font-semibold text-[#1A1918] hover:bg-[#CF6C18]">
                <ImagePlus className="h-3.5 w-3.5" />
                <span>
                  {draft.billing.templateImageDataUrl
                    ? "Replace Sample Photo"
                    : "Upload Sample Photo"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleReceiptTemplateUpload}
                  className="hidden"
                />
              </label>

              {draft.billing.templateImageDataUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setDraft((p) => ({
                      ...p,
                      billing: {
                        ...p.billing,
                        templateImageDataUrl: "",
                        receiptStyle:
                          p.billing.receiptStyle === "custom-template"
                            ? "architectural"
                            : p.billing.receiptStyle,
                      },
                    }))
                  }
                  className="inline-flex min-h-9 items-center gap-1 rounded-[3px] border border-[#E9C4B8] bg-[#FDF2EE] px-3 py-1.5 text-xs font-medium text-[#9A3412]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {draft.billing.templateImageDataUrl && (
            <div className="mt-4 flex items-center gap-4 border-t border-[#E5E1D8] pt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft.billing.templateImageDataUrl}
                alt="Uploaded custom bill receipt sample"
                className="h-28 w-20 rounded-[2px] border border-[#D4CFC4] bg-white object-cover"
              />
              <div className="text-xs text-[#4B4A46]">
                <p className="font-semibold text-[#0D5C43]">
                  Custom Receipt Sample Ready
                </p>
                <p className="mt-1">
                  Click &ldquo;Preview Sample Receipt PDF&rdquo; above to see how
                  client details populate onto your uploaded design.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Studio Receipt Metadata */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#3C3B37]">
              Studio Address (shown on receipts)
            </label>
            <input
              type="text"
              value={draft.billing.studioAddress}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  billing: { ...p.billing, studioAddress: e.target.value },
                }))
              }
              className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#3C3B37]">
              GST / COA Registration No.
            </label>
            <input
              type="text"
              value={draft.billing.gstOrRegNo}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  billing: { ...p.billing, gstOrRegNo: e.target.value },
                }))
              }
              placeholder="e.g. GSTIN 24XXXXX1234X1Z5 or COA Reg No."
              className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#3C3B37]">
              Authorized Signatory Name
            </label>
            <input
              type="text"
              value={draft.billing.signatoryName}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  billing: { ...p.billing, signatoryName: e.target.value },
                }))
              }
              className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#3C3B37]">
              Receipt Footer Note
            </label>
            <input
              type="text"
              value={draft.billing.footerNote}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  billing: { ...p.billing, footerNote: e.target.value },
                }))
              }
              className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: PAYMENT GATEWAYS CONTROL */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* UPI Payment Gateway */}
        <div className="border border-[#E4E0D7] bg-white p-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#F0ECE4] pb-4">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-[#0D5C43]" />
              <h3 className="font-serif text-lg font-bold text-[#1C1B19]">
                UPI / QR Gateway (0% Fee)
              </h3>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#0D5C43]">
              <input
                type="checkbox"
                checked={draft.payment.upiEnabled}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    payment: { ...p.payment, upiEnabled: e.target.checked },
                  }))
                }
                className="h-4 w-4 accent-[#0D5C43]"
              />
              <span>Enabled</span>
            </label>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#3C3B37]">
                Studio UPI ID
              </label>
              <input
                type="text"
                value={draft.payment.upiId}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    payment: { ...p.payment, upiId: e.target.value },
                  }))
                }
                placeholder="akvaiassociates@okicici"
                className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3C3B37]">
                UPI Merchant / Payee Name
              </label>
              <input
                type="text"
                value={draft.payment.upiMerchantName}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    payment: { ...p.payment, upiMerchantName: e.target.value },
                  }))
                }
                className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2 text-sm"
              />
            </div>

            <div className="border border-[#E5E1D8] bg-[#FAF9F5] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#3C3B37]">
                  UPI QR Code Photo
                </span>
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-[3px] border border-[#0D5C43] bg-white px-3 py-1 text-xs font-semibold text-[#0D5C43] hover:bg-[#E5EFEA]">
                    <ImagePlus className="h-3.5 w-3.5" />
                    <span>
                      {draft.payment.upiQrDataUrl ? "Change QR" : "Upload QR"}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleUpiQrUpload}
                      className="hidden"
                    />
                  </label>
                  {draft.payment.upiQrDataUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          payment: { ...p.payment, upiQrDataUrl: "" },
                        }))
                      }
                      className="rounded-[3px] px-2 py-1 text-xs font-medium text-[#9A3412] hover:bg-[#FDF2EE]"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {draft.payment.upiQrDataUrl && (
                <div className="mt-3 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.payment.upiQrDataUrl}
                    alt="Uploaded UPI QR code"
                    className="h-28 w-28 rounded-[3px] border border-[#D8D3C8] bg-white object-contain p-1"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Razorpay Live Payment Gateway */}
        <div className="border border-[#E4E0D7] bg-white p-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#F0ECE4] pb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#0D5C43]" />
              <h3 className="font-serif text-lg font-bold text-[#1C1B19]">
                Razorpay Live Checkout
              </h3>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#0D5C43]">
              <input
                type="checkbox"
                checked={draft.payment.razorpayEnabled}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    payment: {
                      ...p.payment,
                      razorpayEnabled: e.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 accent-[#0D5C43]"
              />
              <span>Enabled</span>
            </label>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-[3px] border border-[#E5E1D8] bg-[#FAF9F5] px-3.5 py-2.5 text-xs">
              <span className="font-medium text-[#585651]">
                Server Secret Status
              </span>
              <span
                className={`font-semibold ${
                  gatewayStatus?.razorpaySecretConfigured
                    ? "text-[#0D5C43]"
                    : "text-[#B45309]"
                }`}
              >
                {gatewayStatus?.razorpaySecretConfigured
                  ? `Configured (${gatewayStatus.razorpaySource})`
                  : "Not configured"}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3C3B37]">
                Razorpay Key ID (Public)
              </label>
              <input
                type="text"
                value={draft.payment.razorpayKeyId}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    payment: { ...p.payment, razorpayKeyId: e.target.value },
                  }))
                }
                placeholder="rzp_live_xxxxxxxxxxxxxx"
                className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3C3B37]">
                Razorpay Key Secret (Stored Server-Only)
              </label>
              <div className="relative mt-1">
                <input
                  type={showRzpSecret ? "text" : "password"}
                  value={rzpSecretInput}
                  onChange={(e) => setRzpSecretInput(e.target.value)}
                  placeholder="Enter secret key to save on server"
                  className="w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] py-2 pr-10 pl-3.5 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowRzpSecret((p) => !p)}
                  aria-label="Toggle Razorpay secret visibility"
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#6B6963]"
                >
                  {showRzpSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-[#6B6963]">
                For permanent Vercel deployments, also set{" "}
                <code className="font-mono">RAZORPAY_KEY_ID</code> &amp;{" "}
                <code className="font-mono">RAZORPAY_KEY_SECRET</code> in Vercel
                Environment Variables.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={savingGateway || !draft.payment.razorpayKeyId}
                onClick={async () => {
                  await onSaveRazorpaySecret(
                    draft.payment.razorpayKeyId,
                    rzpSecretInput
                  );
                  setRzpSecretInput("");
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-[3px] bg-[#1C1B19] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#33322E] disabled:opacity-50"
              >
                {savingGateway ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                <span>Save Razorpay Keys</span>
              </button>

              {gatewayStatus?.razorpaySecretConfigured &&
                gatewayStatus.razorpaySource === "runtime" && (
                  <button
                    type="button"
                    disabled={savingGateway}
                    onClick={() => void onClearRazorpaySecret()}
                    className="inline-flex min-h-9 items-center rounded-[3px] border border-[#E9C4B8] px-3 py-1.5 text-xs font-medium text-[#9A3412] hover:bg-[#FDF2EE]"
                  >
                    Clear Runtime Secret
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* Bank Transfer & Pay on Confirmation */}
        <div className="border border-[#E4E0D7] bg-white p-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-bold text-[#1C1B19]">
                  <Landmark className="h-4 w-4 text-[#0D5C43]" />
                  <span>Bank Transfer (IMPS / NEFT)</span>
                </p>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#0D5C43]">
                  <input
                    type="checkbox"
                    checked={draft.payment.bankEnabled}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        payment: {
                          ...p.payment,
                          bankEnabled: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 accent-[#0D5C43]"
                  />
                  <span>Enabled</span>
                </label>
              </div>
              <textarea
                rows={4}
                value={draft.payment.bankDetails}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    payment: { ...p.payment, bankDetails: e.target.value },
                  }))
                }
                placeholder={"Account Name: Akvai Associates\nBank: HDFC Bank\nA/C No: XXXXXXXXXXXX\nIFSC: HDFC0000123"}
                className="mt-2.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2 font-mono text-xs"
              />
            </div>

            <div className="flex flex-col justify-between border border-[#E5E1D8] bg-[#FAF9F5] p-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-bold text-[#1C1B19]">
                    <IndianRupee className="h-4 w-4 text-[#DF7324]" />
                    <span>Pay on Confirmation</span>
                  </p>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#0D5C43]">
                    <input
                      type="checkbox"
                      checked={draft.payment.payLaterEnabled}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          payment: {
                            ...p.payment,
                            payLaterEnabled: e.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 accent-[#0D5C43]"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#585651]">
                  When enabled, clients can submit their brief without upfront
                  payment and pay after you review their plot details. Disable
                  this if you require upfront UPI / Razorpay payment on every
                  service order.
                </p>
              </div>
              <p className="mt-4 text-[11px] font-medium text-[#0D5C43]">
                Remember to click &ldquo;Save Billing &amp; Gateways&rdquo; after
                toggling any gateway.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
