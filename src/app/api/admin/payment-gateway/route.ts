import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { hasUnsafeKeys, secureJson, verifySameOrigin } from "@/lib/security";
import {
  getPaymentGatewayAdminStatus,
  getSiteConfig,
  saveSiteConfig,
  setRuntimeRazorpaySecret,
} from "@/lib/store";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const status = getPaymentGatewayAdminStatus();
  return secureJson({ status });
}

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return secureJson({ error: "Forbidden request origin." }, { status: 403 });
  }

  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

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
  const razorpayKeyId =
    typeof record.razorpayKeyId === "string"
      ? record.razorpayKeyId.trim().slice(0, 120)
      : undefined;
  const razorpayKeySecret =
    typeof record.razorpayKeySecret === "string"
      ? record.razorpayKeySecret.trim().slice(0, 160)
      : undefined;
  const clearSecret = record.clearSecret === true;

  if (razorpayKeyId !== undefined) {
    const config = await getSiteConfig();
    await saveSiteConfig({
      ...config,
      payment: {
        ...config.payment,
        razorpayKeyId,
      },
    });
  }

  if (clearSecret) {
    setRuntimeRazorpaySecret(null);
  } else if (razorpayKeySecret) {
    setRuntimeRazorpaySecret(razorpayKeySecret);
  }

  return secureJson({
    saved: true,
    status: getPaymentGatewayAdminStatus(),
  });
}
