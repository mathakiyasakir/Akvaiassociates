import crypto from "crypto";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sanitizeImageDataUrl } from "@/lib/default-data";
import {
  checkRateLimit,
  getClientIp,
  hasUnsafeKeys,
  secureJson,
  verifySameOrigin,
} from "@/lib/security";
import {
  createOrder,
  getRazorpayCredentials,
  getSiteConfig,
  isDemoTesterEmail,
  listOrders,
} from "@/lib/store";
import type {
  OrderPaymentInfo,
  PaymentMethod,
  PaymentStatus,
  PlotDetails,
} from "@/lib/types";

const ALLOWED_METHODS = new Set<PaymentMethod>([
  "UPI",
  "Razorpay",
  "Bank Transfer",
  "Pay on Confirmation",
  "Demo Test",
]);

const ALLOWED_NORTH_DIRECTIONS = new Set([
  "North",
  "North-East",
  "East",
  "South-East",
  "South",
  "South-West",
  "West",
  "North-West",
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
]);

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const scope = request.nextUrl.searchParams.get("scope");
  const filterByUser =
    auth.user.role === "admin" && scope === "all" ? undefined : auth.user.id;

  const orders = await listOrders(filterByUser);
  return secureJson({ orders });
}

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return secureJson({ error: "Forbidden request origin." }, { status: 403 });
  }

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const ip = getClientIp(request);
  const limit = checkRateLimit({
    bucket: "create-order",
    key: `${auth.user.id}:${ip}`,
    maxRequests: 12,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.allowed) {
    return secureJson(
      { error: "Too many submissions in a short time. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureJson({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || hasUnsafeKeys(body)) {
    return secureJson({ error: "Invalid input detected." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const serviceId =
    typeof record.serviceId === "string" ? record.serviceId.trim() : "";
  const rawServiceTitle =
    typeof record.serviceTitle === "string" ? record.serviceTitle.trim() : "";
  const projectType =
    typeof record.projectType === "string" && record.projectType.trim()
      ? record.projectType.trim()
      : "Residential";
  const location =
    typeof record.location === "string" ? record.location.trim() : "";
  const budgetRange =
    typeof record.budgetRange === "string" ? record.budgetRange.trim() : "";
  const message =
    typeof record.message === "string" ? record.message.trim() : "";

  const config = await getSiteConfig();
  const matchedService =
    config.services.find((s) => s.id === serviceId && s.enabled) ||
    config.services.find(
      (s) =>
        s.title.toLowerCase() === rawServiceTitle.toLowerCase() && s.enabled
    );

  const serviceTitle = matchedService?.title || rawServiceTitle;
  if (!serviceTitle || serviceTitle.length > 100) {
    return secureJson(
      { error: "Please select a valid architectural service." },
      { status: 400 }
    );
  }

  if (message.length < 8 || message.length > 2000) {
    return secureJson(
      { error: "Please describe your requirements (8 to 2000 characters)." },
      { status: 400 }
    );
  }

  // Validate optional Plot Dimensions & Sketch Photo
  let plotDetails: PlotDetails | undefined;
  if (record.plotDetails && typeof record.plotDetails === "object") {
    const rawPlot = record.plotDetails as Record<string, unknown>;
    const length =
      typeof rawPlot.length === "string" ? rawPlot.length.trim().slice(0, 24) : "";
    const width =
      typeof rawPlot.width === "string" ? rawPlot.width.trim().slice(0, 24) : "";
    const unit: "ft" | "m" = rawPlot.unit === "m" ? "m" : "ft";
    const rawNorth =
      typeof rawPlot.northSide === "string" ? rawPlot.northSide.trim() : "North";
    const northSide = ALLOWED_NORTH_DIRECTIONS.has(rawNorth) ? rawNorth : "North";
    const floors =
      typeof rawPlot.floors === "string" && rawPlot.floors.trim()
        ? rawPlot.floors.trim().slice(0, 40)
        : "Ground Floor (G)";

    const numL = parseFloat(length);
    const numW = parseFloat(width);
    const computedArea =
      Number.isFinite(numL) && Number.isFinite(numW) && numL > 0 && numW > 0
        ? `${Math.round(numL * numW * 100) / 100} sq.${unit}`
        : typeof rawPlot.areaSq === "string"
        ? rawPlot.areaSq.trim().slice(0, 40)
        : "";

    let sketchImageDataUrl: string | undefined;
    if (rawPlot.sketchImageDataUrl) {
      sketchImageDataUrl = sanitizeImageDataUrl(
        rawPlot.sketchImageDataUrl,
        3_000_000,
        false
      );
      if (!sketchImageDataUrl) {
        return secureJson(
          { error: "Plot sketch must be a valid JPG, PNG, or WebP image (max 3 MB)." },
          { status: 400 }
        );
      }
    }

    const sketchFileName =
      typeof rawPlot.sketchFileName === "string"
        ? rawPlot.sketchFileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80)
        : undefined;

    if (length || width || sketchImageDataUrl) {
      plotDetails = {
        length,
        width,
        unit,
        areaSq: computedArea,
        northSide,
        floors,
        sketchImageDataUrl,
        sketchFileName,
      };
    }
  }

  // Authoritative server-side pricing (never trust client amount)
  const authoritativeAmount = matchedService ? matchedService.priceInr : 0;

  const requestedMethod =
    typeof record.paymentMethod === "string" &&
    ALLOWED_METHODS.has(record.paymentMethod as PaymentMethod)
      ? (record.paymentMethod as PaymentMethod)
      : "Pay on Confirmation";

  const rawPaymentRef =
    typeof record.paymentReference === "string"
      ? record.paymentReference.trim().slice(0, 100)
      : "";

  let paymentStatus: PaymentStatus = "Unpaid";
  let referenceId = rawPaymentRef;

  if (requestedMethod === "Demo Test") {
    if (!isDemoTesterEmail(auth.user.email)) {
      return secureJson(
        { error: "Demo payment mode is restricted to the authorized test account." },
        { status: 403 }
      );
    }
    paymentStatus = "Paid";
    referenceId =
      rawPaymentRef || `DEMO-PAY-${Date.now().toString(36).toUpperCase()}`;
  } else if (requestedMethod === "Razorpay") {
    const rzpOrderId =
      typeof record.razorpayOrderId === "string" ? record.razorpayOrderId.trim() : "";
    const rzpPaymentId =
      typeof record.razorpayPaymentId === "string"
        ? record.razorpayPaymentId.trim()
        : "";
    const rzpSignature =
      typeof record.razorpaySignature === "string"
        ? record.razorpaySignature.trim()
        : "";

    const creds = getRazorpayCredentials();
    if (!creds.keySecret || !rzpOrderId || !rzpPaymentId || !rzpSignature) {
      return secureJson(
        { error: "Razorpay payment verification failed. Missing signature details." },
        { status: 400 }
      );
    }

    const expectedSig = crypto
      .createHmac("sha256", creds.keySecret)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest("hex");

    const sigBufA = Buffer.from(expectedSig, "utf8");
    const sigBufB = Buffer.from(rzpSignature, "utf8");
    if (
      sigBufA.length !== sigBufB.length ||
      !crypto.timingSafeEqual(sigBufA, sigBufB)
    ) {
      return secureJson(
        { error: "Razorpay payment signature verification failed." },
        { status: 400 }
      );
    }

    paymentStatus = "Paid";
    referenceId = rzpPaymentId;
  } else if (requestedMethod === "UPI" || requestedMethod === "Bank Transfer") {
    if (!rawPaymentRef || rawPaymentRef.length < 4) {
      return secureJson(
        {
          error:
            requestedMethod === "UPI"
              ? "Please enter your UPI Transaction / UTR Reference ID after paying."
              : "Please enter your Bank Transfer / IMPS / NEFT Reference ID.",
        },
        { status: 400 }
      );
    }
    paymentStatus = "Verification Pending";
    referenceId = rawPaymentRef;
  } else {
    paymentStatus = authoritativeAmount === 0 ? "Paid" : "Unpaid";
    referenceId = referenceId || `CONF-${Date.now().toString(36).toUpperCase()}`;
  }

  const payment: OrderPaymentInfo = {
    amountInr: authoritativeAmount,
    method: requestedMethod,
    status: paymentStatus,
    referenceId,
    paidAt: new Date().toISOString(),
  };

  const order = await createOrder({
    userId: auth.user.id,
    userName: auth.user.name,
    userEmail: auth.user.email,
    serviceId: matchedService?.id,
    serviceTitle,
    projectType: projectType.slice(0, 60),
    location: location.slice(0, 120),
    budgetRange:
      budgetRange.slice(0, 80) ||
      (authoritativeAmount > 0
        ? `₹${authoritativeAmount.toLocaleString("en-IN")}`
        : "Standard"),
    message,
    plotDetails,
    payment,
  });

  return secureJson({ order }, { status: 201 });
}
