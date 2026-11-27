import nodemailer, { type Transporter } from "nodemailer";
import type { SmtpStatus } from "@/lib/types";

interface SmtpRuntimeConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  source: "env" | "runtime";
  verifiedAt: string | null;
}

interface MailerState {
  runtimeConfig: SmtpRuntimeConfig | null;
  lastError: string | null;
}

const globalForMailer = globalThis as unknown as {
  __akvaiMailerState?: MailerState;
};

const ALLOWED_SMTP_PORTS = new Set([25, 465, 587, 2525]);

function getMailerState(): MailerState {
  if (!globalForMailer.__akvaiMailerState) {
    globalForMailer.__akvaiMailerState = {
      runtimeConfig: null,
      lastError: null,
    };
  }
  return globalForMailer.__akvaiMailerState;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const prefix = local.slice(0, Math.min(2, local.length));
  return `${prefix}***@${domain}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function validateSmtpHost(rawHost: string): {
  valid: boolean;
  host?: string;
  error?: string;
} {
  if (typeof rawHost !== "string") {
    return { valid: false, error: "SMTP host is required." };
  }
  const host = rawHost
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  if (!host || !/^[a-z0-9.-]{3,120}$/.test(host) || !host.includes(".")) {
    return { valid: false, error: "Enter a valid public SMTP host (e.g. smtp.gmail.com)." };
  }

  const isBlocked =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "169.254.169.254" ||
    host === "metadata.google.internal" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.startsWith("169.254.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

  if (isBlocked) {
    return {
      valid: false,
      error: "Private, loopback, and metadata SMTP hosts are not permitted.",
    };
  }

  return { valid: true, host };
}

function getEnvSmtpConfig(): SmtpRuntimeConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  const hostCheck = validateSmtpHost(host);
  if (!hostCheck.valid || !hostCheck.host) return null;

  const portNum = Number(process.env.SMTP_PORT || 465);
  const port = ALLOWED_SMTP_PORTS.has(portNum) ? portNum : 465;
  const from = process.env.SMTP_FROM?.trim() || user;

  return {
    host: hostCheck.host,
    port,
    secure: port === 465,
    user,
    pass,
    from,
    source: "env",
    verifiedAt: null,
  };
}

function getActiveSmtpConfig(): SmtpRuntimeConfig | null {
  const envCfg = getEnvSmtpConfig();
  if (envCfg) return envCfg;
  return getMailerState().runtimeConfig;
}

function buildTransporter(cfg: SmtpRuntimeConfig): Transporter {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
}

export function getSmtpStatus(): SmtpStatus {
  const state = getMailerState();
  const cfg = getActiveSmtpConfig();
  if (!cfg) {
    return {
      configured: false,
      source: "none",
      host: null,
      port: null,
      maskedUser: null,
      fromAddress: null,
      verifiedAt: null,
      lastError: state.lastError,
    };
  }

  return {
    configured: true,
    source: cfg.source,
    host: cfg.host,
    port: cfg.port,
    maskedUser: maskEmail(cfg.user),
    fromAddress: cfg.from,
    verifiedAt: cfg.verifiedAt,
    lastError: state.lastError,
  };
}

export async function configureAndVerifySmtp(input: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from?: string;
}): Promise<SmtpStatus> {
  const state = getMailerState();
  const hostCheck = validateSmtpHost(input.host);
  if (!hostCheck.valid || !hostCheck.host) {
    throw new Error(hostCheck.error || "Invalid SMTP host.");
  }

  const port = Number(input.port);
  if (!ALLOWED_SMTP_PORTS.has(port)) {
    throw new Error("SMTP port must be 465 (SSL), 587 (TLS), 2525, or 25.");
  }

  const user = input.user.trim();
  const pass = input.pass.replace(/\s+/g, "").trim();
  if (!user || !pass) {
    throw new Error("Both SMTP username (email) and app password are required.");
  }

  const from = (input.from?.trim() || user).slice(0, 160);
  const candidate: SmtpRuntimeConfig = {
    host: hostCheck.host,
    port,
    secure: port === 465,
    user,
    pass,
    from,
    source: "runtime",
    verifiedAt: null,
  };

  try {
    const transporter = buildTransporter(candidate);
    await transporter.verify();
    candidate.verifiedAt = new Date().toISOString();
    state.runtimeConfig = candidate;
    state.lastError = null;
    return getSmtpStatus();
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "SMTP authentication failed. Check host, port, and App Password.";
    state.lastError = msg;
    throw new Error(msg);
  }
}

export function disconnectRuntimeSmtp(): SmtpStatus {
  const state = getMailerState();
  state.runtimeConfig = null;
  state.lastError = null;
  return getSmtpStatus();
}

export async function sendOtpEmail(params: {
  toEmail: string;
  recipientName: string;
  otpCode: string;
  expiresMinutes: number;
}): Promise<{ sent: boolean; error?: string }> {
  const cfg = getActiveSmtpConfig();
  if (!cfg) {
    return {
      sent: false,
      error:
        "Email OTP service is not connected yet. The website owner must connect free Gmail/SMTP in the hidden Admin Panel (Email / OTP tab) or set SMTP environment variables.",
    };
  }

  const safeName = escapeHtml(params.recipientName || "there");
  const safeCode = escapeHtml(params.otpCode);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #F4F1EA; padding: 28px; color: #1C1B19;">
      <div style="background: #FFFFFF; border: 1px solid #E4E0D7; padding: 32px;">
        <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: #0D5C43;">AKVAI ASSOCIATES</p>
        <h1 style="margin: 12px 0 0; font-size: 24px; font-weight: 700; color: #1C1B19;">Verify your email address</h1>
        <p style="margin: 14px 0 0; font-size: 14px; line-height: 1.6; color: #55534E;">
          Hello ${safeName}, use the 6-digit verification code below to complete your Akvai Associates account registration.
        </p>
        <div style="margin: 24px 0; background: #E5EFEA; border: 1px solid #C6DCD1; padding: 18px; text-align: center;">
          <span style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.28em; color: #0D5C43;">${safeCode}</span>
        </div>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #5C5A55;">
          This code expires in <strong>${params.expiresMinutes} minutes</strong> and can only be used once. If you did not request this code, you can safely ignore this email.
        </p>
      </div>
      <p style="margin: 16px 0 0; font-size: 11px; color: #787670; text-align: center;">
        Akvai Associates · Architectural Practice
      </p>
    </div>
  `;

  const text = `Akvai Associates — Email Verification\n\nHello ${params.recipientName},\n\nYour 6-digit verification code is: ${params.otpCode}\n\nThis code expires in ${params.expiresMinutes} minutes and can only be used once. Never share this code with anyone.\n\n— Akvai Associates`;

  try {
    const transporter = buildTransporter(cfg);
    await transporter.sendMail({
      from: `Akvai Associates <${cfg.from}>`,
      to: params.toEmail,
      subject: `${params.otpCode} is your Akvai Associates verification code`,
      text,
      html,
    });
    getMailerState().lastError = null;
    return { sent: true };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Unable to deliver verification email.";
    getMailerState().lastError = msg;
    return {
      sent: false,
      error: "Failed to send verification email. Please try again shortly.",
    };
  }
}
