"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  Compass,
  Copy,
  CreditCard,
  Download,
  FileText,
  ImagePlus,
  IndianRupee,
  Landmark,
  Loader2,
  MapPin,
  QrCode,
  Ruler,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppContext";
import { ServiceIcon } from "@/components/ServiceIcon";
import { downloadOrderReceiptPdf } from "@/lib/receipt-pdf";
import type { OrderItem, PaymentMethod, ServiceItem } from "@/lib/types";

const NORTH_OPTIONS = [
  "North",
  "North-East",
  "East",
  "South-East",
  "South",
  "South-West",
  "West",
  "North-West",
] as const;

const FLOOR_OPTIONS = [
  "Ground Floor (G)",
  "G+1 (2 Floors)",
  "G+2 (3 Floors)",
  "G+3 (4 Floors)",
  "Duplex / Villa",
  "Commercial / Mixed",
] as const;

const REQUIREMENT_CHIPS = [
  "1 BHK",
  "2 BHK",
  "3 BHK",
  "Attached Toilet",
  "Common Toilet",
  "Modular Kitchen",
  "Car Parking",
  "Vastu Compliant",
  "Pooja Room",
  "Balcony / Sit-out",
] as const;

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function ServiceTabView() {
  const prefersReducedMotion = useReducedMotion();
  const {
    user,
    siteConfig,
    authFetch,
    refreshOrders,
    setActiveTab,
    requireLoginOrRun,
  } = useApp();

  const enabledServices = useMemo(
    () => siteConfig.services.filter((s) => s.enabled),
    [siteConfig.services]
  );

  const isDemoTester = Boolean(user?.isDemoTester);

  const availableMethods = useMemo<PaymentMethod[]>(() => {
    const list: PaymentMethod[] = [];
    if (isDemoTester) {
      list.push("Demo Test");
    }
    if (siteConfig.payment.upiEnabled) list.push("UPI");
    if (siteConfig.payment.razorpayEnabled && siteConfig.payment.razorpayKeyId) {
      list.push("Razorpay");
    }
    if (siteConfig.payment.bankEnabled) list.push("Bank Transfer");
    if (siteConfig.payment.payLaterEnabled) list.push("Pay on Confirmation");
    if (list.length === 0) list.push("Pay on Confirmation");
    return list;
  }, [siteConfig.payment, isDemoTester]);

  // Modal state
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(
    null
  );
  const [step, setStep] = useState<"details" | "payment" | "done">("details");

  // Step 1: Plot & Requirement fields
  const [plotLength, setPlotLength] = useState("");
  const [plotWidth, setPlotWidth] = useState("");
  const [plotUnit, setPlotUnit] = useState<"ft" | "m">("ft");
  const [northSide, setNorthSide] = useState<string>("North");
  const [floors, setFloors] = useState<string>("Ground Floor (G)");
  const [projectType, setProjectType] = useState("Residential");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [sketchDataUrl, setSketchDataUrl] = useState<string | null>(null);
  const [sketchFileName, setSketchFileName] = useState<string>("");

  // Step 2: Payment fields
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    availableMethods[0] || "UPI"
  );
  const [paymentReference, setPaymentReference] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<OrderItem | null>(null);

  const computedArea = useMemo(() => {
    const l = parseFloat(plotLength);
    const w = parseFloat(plotWidth);
    if (Number.isFinite(l) && Number.isFinite(w) && l > 0 && w > 0) {
      return `${Math.round(l * w * 100) / 100} sq.${plotUnit}`;
    }
    return "";
  }, [plotLength, plotWidth, plotUnit]);

  const openServiceForm = (service: ServiceItem) => {
    requireLoginOrRun(() => {
      setSelectedService(service);
      setStep("details");
      setPlotLength("");
      setPlotWidth("");
      setPlotUnit("ft");
      setNorthSide("North");
      setFloors("Ground Floor (G)");
      setProjectType("Residential");
      setLocation("");
      setMessage("");
      setSketchDataUrl(null);
      setSketchFileName("");
      setPaymentMethod(availableMethods[0] || "Pay on Confirmation");
      setPaymentReference("");
      setError(null);
      setCreatedOrder(null);
    }, "service");
  };

  const closeModal = () => {
    if (submitting) return;
    setSelectedService(null);
    setError(null);
  };

  const appendRequirementChip = (chip: string) => {
    setMessage((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return chip;
      if (trimmed.toLowerCase().includes(chip.toLowerCase())) return prev;
      return `${trimmed}, ${chip}`;
    });
  };

  const handleSketchUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      setError("Please upload a JPG, PNG, or WebP plot sketch photo.");
      return;
    }
    if (file.size > 2.8 * 1024 * 1024) {
      setError("Plot sketch photo must be under 2.8 MB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setSketchDataUrl(String(reader.result || ""));
      setSketchFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleContinueToPayment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedService) return;

    if (selectedService.requiresPlotDetails) {
      const l = parseFloat(plotLength);
      const w = parseFloat(plotWidth);
      if (!Number.isFinite(l) || l <= 0 || !Number.isFinite(w) || w <= 0) {
        setError("Please enter valid plot Length and Width dimensions.");
        return;
      }
    }

    if (message.trim().length < 8) {
      setError(
        "Please describe your requirements (e.g. 2 BHK, attached toilets, parking — min 8 characters)."
      );
      return;
    }

    setError(null);
    setStep("payment");
  };

  const buildOrderPayload = (
    method: PaymentMethod,
    extra: Record<string, unknown> = {}
  ) => {
    if (!selectedService) return {};
    return {
      serviceId: selectedService.id,
      serviceTitle: selectedService.title,
      projectType,
      location: location.trim() || "Not specified",
      budgetRange:
        selectedService.priceInr > 0
          ? `₹${selectedService.priceInr.toLocaleString("en-IN")}`
          : "Custom Quote",
      message: message.trim(),
      plotDetails: selectedService.requiresPlotDetails
        ? {
            length: plotLength.trim(),
            width: plotWidth.trim(),
            unit: plotUnit,
            areaSq: computedArea,
            northSide,
            floors,
            sketchImageDataUrl: sketchDataUrl || undefined,
            sketchFileName: sketchFileName || undefined,
          }
        : sketchDataUrl
        ? {
            length: plotLength.trim(),
            width: plotWidth.trim(),
            unit: plotUnit,
            areaSq: computedArea,
            northSide,
            floors,
            sketchImageDataUrl: sketchDataUrl,
            sketchFileName: sketchFileName || undefined,
          }
        : undefined,
      paymentMethod: method,
      paymentReference: paymentReference.trim(),
      ...extra,
    };
  };

  const finalizeOrderSubmit = async () => {
    if (!selectedService) return;
    setError(null);

    if (
      (paymentMethod === "UPI" || paymentMethod === "Bank Transfer") &&
      paymentReference.trim().length < 4
    ) {
      setError(
        paymentMethod === "UPI"
          ? "Please complete payment via UPI and enter your UTR / Transaction ID."
          : "Please enter your Bank Transfer / IMPS / NEFT Reference ID."
      );
      return;
    }

    setSubmitting(true);

    try {
      if (paymentMethod === "Razorpay" && selectedService.priceInr > 0) {
        const scriptOk = await loadRazorpayScript();
        if (!scriptOk || !window.Razorpay) {
          setError(
            "Unable to load Razorpay Checkout script. Please try UPI or another payment method."
          );
          setSubmitting(false);
          return;
        }

        const rzpRes = await authFetch("/api/payments/razorpay-order", {
          method: "POST",
          body: JSON.stringify({
            serviceId: selectedService.id,
            serviceTitle: selectedService.title,
          }),
        });
        const rzpData = (await rzpRes.json()) as {
          orderId?: string;
          amountPaise?: number;
          currency?: string;
          keyId?: string;
          error?: string;
        };

        if (!rzpRes.ok || !rzpData.orderId || !rzpData.keyId) {
          setError(
            rzpData.error || "Could not start Razorpay payment. Try UPI instead."
          );
          setSubmitting(false);
          return;
        }

        const rzp = new window.Razorpay({
          key: rzpData.keyId,
          amount: rzpData.amountPaise,
          currency: rzpData.currency || "INR",
          name: siteConfig.brand.name,
          description: selectedService.title,
          order_id: rzpData.orderId,
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
          },
          theme: { color: "#0D5C43" },
          modal: {
            ondismiss: () => {
              setSubmitting(false);
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const confirmRes = await authFetch("/api/orders", {
                method: "POST",
                body: JSON.stringify(
                  buildOrderPayload("Razorpay", {
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  })
                ),
              });
              const confirmData = (await confirmRes.json()) as {
                order?: OrderItem;
                error?: string;
              };
              if (!confirmRes.ok || !confirmData.order) {
                setError(
                  confirmData.error ||
                    "Payment received but order confirmation failed. Contact studio."
                );
                return;
              }
              setCreatedOrder(confirmData.order);
              setStep("done");
              await refreshOrders();
            } catch {
              setError("Network error while verifying Razorpay payment.");
            } finally {
              setSubmitting(false);
            }
          },
        });
        rzp.open();
        return;
      }

      // UPI / Bank Transfer / Pay on Confirmation
      const res = await authFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify(buildOrderPayload(paymentMethod)),
      });
      const data = (await res.json()) as { order?: OrderItem; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error || "Unable to submit your service order.");
        return;
      }
      setCreatedOrder(data.order);
      setStep("done");
      await refreshOrders();
    } catch {
      setError("Network error while submitting your service order.");
    } finally {
      if (paymentMethod !== "Razorpay") {
        setSubmitting(false);
      }
    }
  };

  const handleDownloadReceipt = async () => {
    if (!createdOrder) return;
    setDownloadingPdf(true);
    try {
      await downloadOrderReceiptPdf(createdOrder, siteConfig);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopyUpi = async () => {
    if (!siteConfig.payment.upiId) return;
    try {
      await navigator.clipboard.writeText(siteConfig.payment.upiId);
      setCopiedUpi(true);
      window.setTimeout(() => setCopiedUpi(false), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  const upiDeepLink =
    selectedService && siteConfig.payment.upiId
      ? `upi://pay?pa=${encodeURIComponent(
          siteConfig.payment.upiId
        )}&pn=${encodeURIComponent(
          siteConfig.payment.upiMerchantName || siteConfig.brand.name
        )}&am=${encodeURIComponent(
          String(selectedService.priceInr || 0)
        )}&cu=INR&tn=${encodeURIComponent(selectedService.title)}`
      : "";

  return (
    <div className="min-h-[calc(100vh-144px)] bg-[#F4F1EA] pb-28">
      <section className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
        <div className="flex flex-col justify-between gap-4 border-b border-[#DED9CE] pb-7 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
              ARCHITECTURAL SERVICES DIRECTORY
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-4xl">
              Select a service to begin your design brief.
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-[#585651] sm:text-base">
              Tap any architectural service below to enter your plot dimensions,
              north orientation, sketch photo, and room requirements. Your bill
              receipt PDF generates instantly after booking.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              requireLoginOrRun(() => setActiveTab("orders"), "orders")
            }
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-[3px] border border-[#0D5C43] bg-white px-4 py-2 text-xs font-semibold text-[#0D5C43] transition-colors hover:bg-[#E5EFEA] sm:self-auto"
          >
            <ClipboardList className="h-4 w-4" />
            <span>My Orders &amp; Receipts</span>
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {enabledServices.map((service, index) => (
            <motion.article
              key={service.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.32,
                delay: prefersReducedMotion ? 0 : index * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group flex flex-col justify-between border border-[#DFDBD0] bg-white p-6 shadow-[0_8px_28px_-20px_rgba(24,28,26,0.2)] transition-all duration-200 hover:border-[#0D5C43] sm:p-8"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] bg-[#E5EFEA] transition-colors group-hover:bg-[#0D5C43] group-hover:[&_svg]:text-white">
                      <ServiceIcon icon={service.icon} />
                    </div>
                    <div>
                      <p className="font-mono text-xs font-semibold text-[#0D5C43]">
                        {service.number}
                      </p>
                      <h2 className="mt-0.5 font-serif text-2xl font-bold text-[#1C1B19]">
                        {service.title}
                      </h2>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-xl font-bold tabular-nums text-[#1C1B19]">
                      {service.priceInr > 0
                        ? `₹${service.priceInr.toLocaleString("en-IN")}`
                        : "Custom"}
                    </p>
                    <p className="text-[11px] font-medium text-[#6B6963]">
                      {service.timeline}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[#575550]">
                  {service.description}
                </p>

                <div className="mt-5 border-t border-[#F0ECE4] pt-4">
                  <p className="text-[11px] font-semibold tracking-[0.08em] text-[#0D5C43]">
                    WHAT YOU RECEIVE
                  </p>
                  <ul className="mt-2.5 space-y-1.5 text-xs text-[#4B4A46]">
                    {service.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0D5C43]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-2">
                <motion.button
                  type="button"
                  onClick={() => openServiceForm(service)}
                  whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                  className="inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-[3px] bg-[#0D5C43] px-5 py-3 text-sm font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-[#094734] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43]"
                >
                  <span className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-[#F3B073]" />
                    <span>Book {service.title}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#E07A22] px-2.5 py-1 text-xs font-bold text-[#1A1918]">
                    <span>Start Form</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </motion.button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Architectural Booking & Payment Modal */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Book ${selectedService.title}`}
          >
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: 18 }}
              className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[10px] border border-[#D8D3C8] bg-white shadow-2xl sm:rounded-[4px]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between gap-4 border-b border-[#E5E1D8] bg-[#FAF9F5] px-5 py-4 sm:px-6">
                <div>
                  <p className="font-mono text-[11px] font-semibold text-[#0D5C43]">
                    {step === "details"
                      ? "STEP 1 OF 2 · ARCHITECTURAL BRIEF"
                      : step === "payment"
                      ? "STEP 2 OF 2 · PAYMENT & RECEIPT"
                      : "BOOKING CONFIRMED"}
                  </p>
                  <h2 className="mt-0.5 font-serif text-xl font-bold text-[#1C1B19]">
                    {selectedService.title}{" "}
                    {selectedService.priceInr > 0 && (
                      <span className="font-mono text-base font-semibold text-[#DF7324]">
                        · ₹{selectedService.priceInr.toLocaleString("en-IN")}
                      </span>
                    )}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close booking form"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-[#585651] hover:bg-[#ECE8DF] hover:text-[#1C1B19]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto px-5 py-5 sm:px-6">
                {step === "details" && (
                  <form
                    onSubmit={handleContinueToPayment}
                    className="space-y-5"
                  >
                    {/* Plot Dimensions */}
                    <div className="border border-[#E5E1D8] bg-[#FAF9F5] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.06em] text-[#0D5C43]">
                          <Ruler className="h-3.5 w-3.5" />
                          <span>PLOT DIMENSIONS &amp; FLOORS</span>
                        </p>
                        <div className="inline-flex rounded-[3px] border border-[#D8D3C8] bg-white p-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setPlotUnit("ft")}
                            className={`rounded-[2px] px-2.5 py-1 font-semibold ${
                              plotUnit === "ft"
                                ? "bg-[#0D5C43] text-white"
                                : "text-[#585651]"
                            }`}
                          >
                            Feet (ft)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPlotUnit("m")}
                            className={`rounded-[2px] px-2.5 py-1 font-semibold ${
                              plotUnit === "m"
                                ? "bg-[#0D5C43] text-white"
                                : "text-[#585651]"
                            }`}
                          >
                            Meters (m)
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#3C3B37]">
                            Length ({plotUnit}) *
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="1"
                            required={selectedService.requiresPlotDetails}
                            value={plotLength}
                            onChange={(e) => setPlotLength(e.target.value)}
                            placeholder={plotUnit === "ft" ? "e.g. 40" : "e.g. 12"}
                            className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-white px-3 py-2 text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#3C3B37]">
                            Width ({plotUnit}) *
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="1"
                            required={selectedService.requiresPlotDetails}
                            value={plotWidth}
                            onChange={(e) => setPlotWidth(e.target.value)}
                            placeholder={plotUnit === "ft" ? "e.g. 30" : "e.g. 9"}
                            className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-white px-3 py-2 text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:outline-none"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-semibold text-[#3C3B37]">
                            Floors
                          </label>
                          <select
                            value={floors}
                            onChange={(e) => setFloors(e.target.value)}
                            className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-white px-3 py-2 text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:outline-none"
                          >
                            {FLOOR_OPTIONS.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {computedArea && (
                        <p className="mt-2.5 font-mono text-xs font-semibold text-[#0D5C43]">
                          Calculated Plot Area: {computedArea}
                        </p>
                      )}
                    </div>

                    {/* North Side Orientation */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.06em] text-[#3C3B37]">
                        <Compass className="h-3.5 w-3.5 text-[#0D5C43]" />
                        <span>NORTH SIDE / PLOT FACING DIRECTION *</span>
                      </label>
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {NORTH_OPTIONS.map((dir) => {
                          const active = northSide === dir;
                          return (
                            <button
                              key={dir}
                              type="button"
                              onClick={() => setNorthSide(dir)}
                              className={`min-h-10 rounded-[3px] border px-2 py-1.5 text-xs font-semibold transition-colors ${
                                active
                                  ? "border-[#0D5C43] bg-[#0D5C43] text-white"
                                  : "border-[#D8D3C8] bg-[#FAF9F5] text-[#3C3B37] hover:border-[#0D5C43]"
                              }`}
                            >
                              {dir}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Plot Sketch Photo Upload */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.06em] text-[#3C3B37]">
                        <ImagePlus className="h-3.5 w-3.5 text-[#0D5C43]" />
                        <span>PLOT SKETCH / SITE PHOTO UPLOAD (OPTIONAL)</span>
                      </label>
                      {sketchDataUrl ? (
                        <div className="mt-2 flex items-center gap-4 border border-[#D8D3C8] bg-[#FAF9F5] p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sketchDataUrl}
                            alt="Uploaded plot sketch"
                            className="h-20 w-24 rounded-[2px] border border-[#DDD8CE] bg-white object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-[#1C1B19]">
                              {sketchFileName || "plot-sketch.jpg"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#0D5C43]">
                              Sketch ready to send to architect
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSketchDataUrl(null);
                              setSketchFileName("");
                            }}
                            className="inline-flex h-9 items-center gap-1 rounded-[3px] border border-[#E9C4B8] bg-[#FDF2EE] px-2.5 text-xs font-medium text-[#9A3412]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      ) : (
                        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-[3px] border border-dashed border-[#B9B3A5] bg-[#FAF9F5] px-4 py-5 text-center transition-colors hover:border-[#0D5C43] hover:bg-[#F1F6F3]">
                          <ImagePlus className="h-6 w-6 text-[#0D5C43]" />
                          <span className="mt-1.5 text-xs font-semibold text-[#1C1B19]">
                            Tap to upload rough plot sketch or site photo
                          </span>
                          <span className="mt-0.5 text-[11px] text-[#6B6963]">
                            JPG, PNG, or WebP · Max 2.8 MB
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleSketchUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Location & Project Category */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="flex items-center gap-1 text-xs font-semibold text-[#3C3B37]">
                          <MapPin className="h-3.5 w-3.5 text-[#0D5C43]" />
                          <span>Site City / Location</span>
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Surat, Ahmedabad, Pune"
                          className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-xs font-semibold text-[#3C3B37]">
                          <Building2 className="h-3.5 w-3.5 text-[#0D5C43]" />
                          <span>Building Type</span>
                        </label>
                        <select
                          value={projectType}
                          onChange={(e) => setProjectType(e.target.value)}
                          className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2 text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                        >
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Villa / Farmhouse">
                            Villa / Farmhouse
                          </option>
                          <option value="Interior Renovation">
                            Interior Renovation
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Requirement Description Box + Quick Architectural Chips */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3C3B37]">
                        Your Requirements (BHK, Attached Toilets, Kitchen,
                        Parking, Vastu, etc.) *
                      </label>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {REQUIREMENT_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => appendRequirementChip(chip)}
                            className="rounded-[2px] border border-[#D8D3C8] bg-[#FAF9F5] px-2.5 py-1 text-[11px] font-medium text-[#3C3B37] transition-colors hover:border-[#0D5C43] hover:bg-[#E5EFEA] hover:text-[#0D5C43]"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={4}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Example: Need 2 BHK layout on Ground Floor with 2 attached toilets, 1 common bathroom, modular kitchen in SE corner, car parking in front, and staircase outside..."
                        className="mt-2 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm text-[#1C1B19] placeholder:text-[#8E8C85] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                      />
                    </div>

                    {error && (
                      <p
                        role="alert"
                        className="rounded-[3px] border border-[#E9C4B8] bg-[#FDF2EE] px-3.5 py-2.5 text-xs font-medium text-[#9A3412]"
                      >
                        {error}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#ECE8E0] pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="inline-flex min-h-11 items-center rounded-[3px] border border-[#D8D3C8] px-4 py-2 text-sm font-medium text-[#585651] hover:bg-[#F4F1EA]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center gap-2 rounded-[3px] bg-[#E07A22] px-6 py-2.5 text-sm font-semibold text-[#1A1918] transition-colors hover:bg-[#CF6C18]"
                      >
                        <span>Proceed to Payment</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}

                {step === "payment" && (
                  <div className="space-y-5">
                    {/* Summary Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border border-[#D8D3C8] bg-[#FAF9F5] p-4">
                      <div>
                        <p className="text-xs font-semibold text-[#0D5C43]">
                          ORDER SUMMARY
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#1C1B19]">
                          {selectedService.title}
                        </p>
                        {plotLength && plotWidth && (
                          <p className="mt-0.5 text-xs text-[#585651]">
                            Plot: {plotLength} × {plotWidth} {plotUnit}
                            {computedArea ? ` (${computedArea})` : ""} · North:{" "}
                            {northSide} · {floors}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium text-[#6B6963]">
                          Total Payable
                        </p>
                        <p className="font-mono text-2xl font-bold tabular-nums text-[#DF7324]">
                          ₹{selectedService.priceInr.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                      <p className="text-xs font-semibold tracking-[0.06em] text-[#3C3B37]">
                        CHOOSE PAYMENT METHOD
                      </p>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {availableMethods.map((method) => {
                          const active = paymentMethod === method;
                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => {
                                setPaymentMethod(method);
                                setError(null);
                              }}
                              className={`flex min-h-12 items-center gap-2.5 rounded-[3px] border px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                                active
                                  ? "border-[#0D5C43] bg-[#E5EFEA] text-[#0D5C43]"
                                  : "border-[#D8D3C8] bg-white text-[#3C3B37] hover:border-[#0D5C43]"
                              }`}
                            >
                              {method === "Demo Test" && (
                                <Sparkles className="h-4 w-4 shrink-0 text-[#DF7324]" />
                              )}
                              {method === "UPI" && (
                                <QrCode className="h-4 w-4 shrink-0" />
                              )}
                              {method === "Razorpay" && (
                                <CreditCard className="h-4 w-4 shrink-0" />
                              )}
                              {method === "Bank Transfer" && (
                                <Landmark className="h-4 w-4 shrink-0" />
                              )}
                              {method === "Pay on Confirmation" && (
                                <IndianRupee className="h-4 w-4 shrink-0" />
                              )}
                              <span>
                                {method === "Demo Test"
                                  ? "Demo Test Payment"
                                  : method}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Owner Demo Test Payment Box (strictly visible only to test user account) */}
                    {paymentMethod === "Demo Test" && isDemoTester && (
                      <div className="space-y-2 border border-[#E7B68C] bg-[#FFF8F2] p-4">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-[#B95713]">
                          <Sparkles className="h-3.5 w-3.5 shrink-0" />
                          OWNER TEST ACCOUNT · INSTANT DEMO PAYMENT
                        </p>
                        <p className="text-xs leading-relaxed text-[#4A4945]">
                          Only your dedicated testing account (
                          <strong>{user?.email}</strong>) sees this option.
                          Regular clients will only see your live payment
                          gateways configured in the Admin Panel. Clicking below
                          instantly marks this order as <strong>Paid</strong>,
                          generates the Bill Receipt PDF, and sends the order to
                          your Admin Panel so you can test the full workflow end
                          to end.
                        </p>
                      </div>
                    )}

                    {/* UPI Details Box */}
                    {paymentMethod === "UPI" && (
                      <div className="space-y-4 border border-[#C6DCD1] bg-[#F5FAF7] p-4">
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                          {siteConfig.payment.upiQrDataUrl && (
                            <div className="shrink-0 rounded-[4px] border border-[#D8D3C8] bg-white p-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={siteConfig.payment.upiQrDataUrl}
                                alt="Akvai Associates UPI QR"
                                className="h-32 w-32 object-contain"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="text-xs font-semibold text-[#0D5C43]">
                              PAY VIA ANY UPI APP (GPAY / PHONEPE / PAYTM)
                            </p>
                            <p className="text-xs text-[#4A4945]">
                              Merchant:{" "}
                              <strong>
                                {siteConfig.payment.upiMerchantName ||
                                  siteConfig.brand.name}
                              </strong>
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <code className="rounded-[2px] border border-[#C6DCD1] bg-white px-2.5 py-1 font-mono text-xs font-semibold text-[#1C1B19]">
                                {siteConfig.payment.upiId || "Ask studio for UPI"}
                              </code>
                              {siteConfig.payment.upiId && (
                                <button
                                  type="button"
                                  onClick={() => void handleCopyUpi()}
                                  className="inline-flex items-center gap-1 rounded-[2px] border border-[#0D5C43] bg-white px-2.5 py-1 text-xs font-semibold text-[#0D5C43]"
                                >
                                  <Copy className="h-3 w-3" />
                                  <span>{copiedUpi ? "Copied" : "Copy UPI"}</span>
                                </button>
                              )}
                            </div>
                            {upiDeepLink && (
                              <a
                                href={upiDeepLink}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DF7324] underline underline-offset-4"
                              >
                                <span>Open UPI Payment App</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1C1B19]">
                            Enter 12-Digit UPI UTR / Transaction Reference ID *
                          </label>
                          <input
                            type="text"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="e.g. 412890123456"
                            className="mt-1.5 w-full rounded-[3px] border border-[#B9CBBF] bg-white px-3.5 py-2.5 font-mono text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Razorpay Info */}
                    {paymentMethod === "Razorpay" && (
                      <div className="border border-[#D8D3C8] bg-[#FAF9F5] p-4 text-xs leading-relaxed text-[#4A4945]">
                        <p className="flex items-center gap-1.5 font-semibold text-[#0D5C43]">
                          <ShieldCheck className="h-4 w-4" />
                          <span>INSTANT RAZORPAY GATEWAY</span>
                        </p>
                        <p className="mt-1">
                          Pay securely via UPI, Cards, or NetBanking through
                          Razorpay. Payment is verified automatically on our
                          server and your Bill Receipt PDF unlocks immediately.
                        </p>
                      </div>
                    )}

                    {/* Bank Transfer Info */}
                    {paymentMethod === "Bank Transfer" && (
                      <div className="space-y-3 border border-[#D8D3C8] bg-[#FAF9F5] p-4">
                        <p className="text-xs font-semibold text-[#0D5C43]">
                          STUDIO BANK DETAILS (IMPS / NEFT / RTGS)
                        </p>
                        <pre className="whitespace-pre-wrap rounded-[3px] border border-[#E4E0D7] bg-white p-3 font-mono text-xs text-[#2A2926]">
                          {siteConfig.payment.bankDetails ||
                            "Contact studio for bank transfer details."}
                        </pre>
                        <div>
                          <label className="block text-xs font-semibold text-[#1C1B19]">
                            Bank Transfer Reference / IMPS ID *
                          </label>
                          <input
                            type="text"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="Enter IMPS / NEFT transaction reference"
                            className="mt-1 w-full rounded-[3px] border border-[#D8D3C8] bg-white px-3.5 py-2.5 font-mono text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Pay on Confirmation */}
                    {paymentMethod === "Pay on Confirmation" && (
                      <div className="border border-[#D8D3C8] bg-[#FAF9F5] p-4 text-xs leading-relaxed text-[#4A4945]">
                        <p className="font-semibold text-[#1C1B19]">
                          Submit Brief Now · Pay on Studio Confirmation
                        </p>
                        <p className="mt-1">
                          Your complete architectural brief, plot dimensions, and
                          sketch will be sent straight to the Akvai Associates
                          owner panel with an instant receipt summary.
                        </p>
                      </div>
                    )}

                    {error && (
                      <p
                        role="alert"
                        className="rounded-[3px] border border-[#E9C4B8] bg-[#FDF2EE] px-3.5 py-2.5 text-xs font-medium text-[#9A3412]"
                      >
                        {error}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ECE8E0] pt-4">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                          setStep("details");
                          setError(null);
                        }}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-[3px] border border-[#D8D3C8] px-4 py-2 text-sm font-medium text-[#585651] hover:bg-[#F4F1EA]"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Edit Details</span>
                      </button>

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void finalizeOrderSubmit()}
                        className="inline-flex min-h-11 items-center gap-2 rounded-[3px] bg-[#E07A22] px-6 py-2.5 text-sm font-semibold text-[#1A1918] transition-colors hover:bg-[#CF6C18] disabled:opacity-60"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Processing Order...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            <span>
                              {paymentMethod === "Demo Test"
                                ? `Complete Demo Test Payment (₹${selectedService.priceInr.toLocaleString(
                                    "en-IN"
                                  )})`
                                : paymentMethod === "Razorpay"
                                ? `Pay ₹${selectedService.priceInr.toLocaleString(
                                    "en-IN"
                                  )} via Razorpay`
                                : "Confirm Order & Generate Bill Receipt"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {step === "done" && createdOrder && (
                  <div className="space-y-5 py-2">
                    <div className="flex items-start gap-3 border border-[#C6DCD1] bg-[#E5EFEA] p-4 text-[#0D5C43]">
                      <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" />
                      <div>
                        <p className="font-mono text-xs font-bold">
                          ORDER CONFIRMED · {createdOrder.id} ·{" "}
                          {createdOrder.invoiceNumber}
                        </p>
                        <h3 className="mt-1 font-serif text-xl font-bold text-[#1C1B19]">
                          Your architectural brief is with our studio.
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-[#3C3B37]">
                          All plot details, sketch photos, and payment info have
                          been sent directly to Akvai Associates. Download your
                          Bill Receipt PDF below or track final architectural
                          PDFs inside your Orders page.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border border-[#E4E0D7] bg-[#FAF9F5] p-4 text-xs">
                      <div>
                        <span className="text-[#6B6963]">Client Name</span>
                        <p className="mt-0.5 font-semibold text-[#1C1B19]">
                          {createdOrder.userName}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#6B6963]">Service Booked</span>
                        <p className="mt-0.5 font-semibold text-[#1C1B19]">
                          {createdOrder.serviceTitle}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#6B6963]">Amount &amp; Method</span>
                        <p className="mt-0.5 font-mono font-semibold text-[#1C1B19]">
                          ₹{createdOrder.payment.amountInr.toLocaleString("en-IN")}{" "}
                          · {createdOrder.payment.method}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#6B6963]">Payment Status</span>
                        <p className="mt-0.5 font-semibold text-[#0D5C43]">
                          {createdOrder.payment.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        disabled={downloadingPdf}
                        onClick={() => void handleDownloadReceipt()}
                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[3px] bg-[#0D5C43] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#094734] disabled:opacity-60"
                      >
                        {downloadingPdf ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <span>Download Bill Receipt (PDF)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedService(null);
                          setActiveTab("orders");
                        }}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-5 py-2.5 text-sm font-semibold text-[#1A1918] transition-colors hover:bg-[#CF6C18]"
                      >
                        <ClipboardList className="h-4 w-4" />
                        <span>Track in Orders</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
