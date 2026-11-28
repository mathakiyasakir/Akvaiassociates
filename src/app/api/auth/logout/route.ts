import { NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { secureJson, verifySameOrigin } from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return secureJson({ error: "Forbidden request origin." }, { status: 403 });
  }
  const res = secureJson({ ok: true });
  return clearSessionCookie(res, request);
}
