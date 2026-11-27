import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  configureAndVerifySmtp,
  disconnectRuntimeSmtp,
  getSmtpStatus,
  sendOtpEmail,
} from "@/lib/mailer";
import {
  hasUnsafeKeys,
  secureJson,
  verifySameOrigin,
} from "@/lib/security";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  return secureJson({ status: getSmtpStatus() });
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
    return secureJson({ error: "Invalid input detected." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const action = typeof record.action === "string" ? record.action : "connect";

  if (action === "test") {
    const testEmail =
      typeof record.testEmail === "string" && record.testEmail.trim()
        ? record.testEmail.trim().toLowerCase()
        : auth.user.email;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(testEmail)) {
      return secureJson(
        { error: "Enter a valid test recipient email address." },
        { status: 400 }
      );
    }

    const result = await sendOtpEmail({
      toEmail: testEmail,
      recipientName: auth.user.name,
      otpCode: "000000",
      expiresMinutes: 5,
    });

    if (!result.sent) {
      return secureJson(
        { error: result.error || "Test email failed to send." },
        { status: 400 }
      );
    }

    return secureJson({
      ok: true,
      message: `Test verification email sent to ${testEmail}.`,
      status: getSmtpStatus(),
    });
  }

  const host = typeof record.host === "string" ? record.host : "";
  const port = Number(record.port || 465);
  const user = typeof record.user === "string" ? record.user : "";
  const pass = typeof record.pass === "string" ? record.pass : "";
  const from = typeof record.from === "string" ? record.from : "";

  try {
    const status = await configureAndVerifySmtp({
      host,
      port,
      user,
      pass,
      from,
    });
    return secureJson({
      ok: true,
      message: "SMTP connected and verified. Real Email OTP delivery is now live.",
      status,
    });
  } catch (err) {
    return secureJson(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not verify SMTP credentials.",
        status: getSmtpStatus(),
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return secureJson({ error: "Forbidden request origin." }, { status: 403 });
  }
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const status = disconnectRuntimeSmtp();
  return secureJson({ status });
}
