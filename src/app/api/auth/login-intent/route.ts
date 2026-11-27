import { NextRequest } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  secureJson,
  signLoginIntentToken,
  verifySameOrigin,
} from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return secureJson({ error: "Forbidden request origin." }, { status: 403 });
  }

  const ip = getClientIp(request);
  const limit = checkRateLimit({
    bucket: "login-intent",
    key: ip,
    maxRequests: 40,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.allowed) {
    return secureJson(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  const issued = signLoginIntentToken();
  return secureJson({
    intentToken: issued.token,
    expiresInSeconds: issued.expiresInSeconds,
  });
}
