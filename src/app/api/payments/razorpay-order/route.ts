import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  checkRateLimit,
  getClientIp,
  hasUnsafeKeys,
  secureJson,
  verifySameOrigin,
} from "@/lib/security";
import { getRazorpayCredentials, getSiteConfig } from "@/lib/store";

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return secureJson({ error: "Forbidden request origin." }, { status: 403 });
  }

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const ip = getClientIp(request);
  const limit = checkRateLimit({
    bucket: "razorpay-order",
    key: `${auth.user.id}:${ip}`,
    maxRequests: 15,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.allowed) {
    return secureJson(
      { error: "Too many payment attempts. Please wait a few minutes." },
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
    return secureJson({ error: "Invalid input payload." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const serviceId =
    typeof record.serviceId === "string" ? record.serviceId.trim() : "";
  const serviceTitle =
    typeof record.serviceTitle === "string" ? record.serviceTitle.trim() : "";

  const config = await getSiteConfig();
  if (!config.payment.razorpayEnabled) {
    return secureJson(
      { error: "Razorpay checkout is currently disabled by studio administration." },
      { status: 400 }
    );
  }

  const creds = getRazorpayCredentials();
  if (!creds.keyId || !creds.keySecret) {
    return secureJson(
      {
        error:
          "Razorpay gateway keys are not fully configured yet. Please choose UPI or another active payment option.",
      },
      { status: 400 }
    );
  }

  const matchedService =
    config.services.find((s) => s.id === serviceId && s.enabled) ||
    config.services.find(
      (s) => s.title.toLowerCase() === serviceTitle.toLowerCase() && s.enabled
    );

  if (!matchedService || matchedService.priceInr <= 0) {
    return secureJson(
      { error: "Selected service is unavailable or has no payable fee." },
      { status: 400 }
    );
  }

  const amountPaise = Math.round(matchedService.priceInr * 100);
  const authHeader = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString(
    "base64"
  );

  try {
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `akv_${Date.now()}`,
        notes: {
          serviceId: matchedService.id,
          serviceTitle: matchedService.title,
          clientEmail: auth.user.email,
        },
      }),
    });

    const data = await rzpRes.json().catch(() => null);
    if (!rzpRes.ok || !data?.id) {
      return secureJson(
        {
          error:
            data?.error?.description ||
            "Unable to initialize Razorpay checkout. Try UPI or contact the studio.",
        },
        { status: 502 }
      );
    }

    return secureJson({
      orderId: data.id,
      amountPaise,
      amountInr: matchedService.priceInr,
      currency: "INR",
      keyId: creds.keyId,
    });
  } catch {
    return secureJson(
      { error: "Failed to reach Razorpay payment gateway. Please try again." },
      { status: 502 }
    );
  }
}
