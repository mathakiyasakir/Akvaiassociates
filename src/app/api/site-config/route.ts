import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  DEFAULT_SITE_CONFIG,
  sanitizeImageDataUrl,
  sanitizeImageUrl,
} from "@/lib/default-data";
import { hasUnsafeKeys, secureJson, verifySameOrigin } from "@/lib/security";
import { getSiteConfig, saveSiteConfig } from "@/lib/store";
import type {
  ReceiptStyleMode,
  ServiceIconKey,
  ServiceItem,
  ShowcaseItem,
  SiteConfig,
} from "@/lib/types";

const ALLOWED_ICONS = new Set<ServiceIconKey>([
  "building",
  "grid",
  "ruler",
  "box",
  "compass",
  "layers",
  "pentool",
  "home",
]);

const ALLOWED_RECEIPT_STYLES = new Set<ReceiptStyleMode>([
  "architectural",
  "minimal",
  "custom-template",
]);

function pickStr(val: unknown, fallback: string, max = 400): string {
  if (typeof val !== "string") return fallback;
  const trimmed = val.trim();
  return trimmed ? trimmed.slice(0, max) : fallback;
}

function pickOptionalStr(val: unknown, fallback: string, max = 400): string {
  if (typeof val !== "string") return fallback;
  return val.trim().slice(0, max);
}

export async function GET() {
  const config = await getSiteConfig();
  return secureJson({ config });
}

export async function PUT(request: NextRequest) {
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

  const raw = (body as { config?: Record<string, unknown> })?.config;
  if (!raw || typeof raw !== "object") {
    return secureJson({ error: "Missing config payload." }, { status: 400 });
  }

  const current = await getSiteConfig();
  const rawBrand = (raw.brand as Record<string, unknown>) || {};
  const rawHero = (raw.hero as Record<string, unknown>) || {};
  const rawServicesSec = (raw.servicesSection as Record<string, unknown>) || {};
  const rawShowcaseSec = (raw.showcaseSection as Record<string, unknown>) || {};
  const rawPractice = (raw.practice as Record<string, unknown>) || {};
  const rawContact = (raw.contact as Record<string, unknown>) || {};
  const rawBilling = (raw.billing as Record<string, unknown>) || {};
  const rawPayment = (raw.payment as Record<string, unknown>) || {};

  // Brand logo: PNG only, allow explicit clearing via empty string / null
  let nextLogoDataUrl: string | undefined = current.brand.logoDataUrl;
  if ("logoDataUrl" in rawBrand) {
    if (!rawBrand.logoDataUrl) {
      nextLogoDataUrl = undefined;
    } else {
      const checkedLogo = sanitizeImageDataUrl(
        rawBrand.logoDataUrl,
        1_500_000,
        true
      );
      if (!checkedLogo) {
        return secureJson(
          { error: "Website logo must be a valid transparent PNG file (max 1.5 MB)." },
          { status: 400 }
        );
      }
      nextLogoDataUrl = checkedLogo;
    }
  }

  // Receipt custom template image
  let nextReceiptTemplate: string | undefined = current.billing.templateImageDataUrl;
  if ("templateImageDataUrl" in rawBilling) {
    if (!rawBilling.templateImageDataUrl) {
      nextReceiptTemplate = undefined;
    } else {
      const checkedTpl = sanitizeImageDataUrl(
        rawBilling.templateImageDataUrl,
        3_000_000,
        false
      );
      if (!checkedTpl) {
        return secureJson(
          { error: "Receipt template must be a valid PNG, JPG, or WebP image (max 3 MB)." },
          { status: 400 }
        );
      }
      nextReceiptTemplate = checkedTpl;
    }
  }

  // UPI QR image
  let nextUpiQr: string | undefined = current.payment.upiQrDataUrl;
  if ("upiQrDataUrl" in rawPayment) {
    if (!rawPayment.upiQrDataUrl) {
      nextUpiQr = undefined;
    } else {
      const checkedQr = sanitizeImageDataUrl(
        rawPayment.upiQrDataUrl,
        1_500_000,
        false
      );
      if (!checkedQr) {
        return secureJson(
          { error: "UPI QR code must be a valid PNG, JPG, or WebP image (max 1.5 MB)." },
          { status: 400 }
        );
      }
      nextUpiQr = checkedQr;
    }
  }

  const services: ServiceItem[] = Array.isArray(raw.services)
    ? raw.services.slice(0, 20).map((item, idx) => {
        const s = (item as Record<string, unknown>) || {};
        const iconCandidate = s.icon as ServiceIconKey;
        const icon: ServiceIconKey = ALLOWED_ICONS.has(iconCandidate)
          ? iconCandidate
          : "building";
        const deliverables = Array.isArray(s.deliverables)
          ? s.deliverables
              .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
              .map((d) => d.trim().slice(0, 160))
              .slice(0, 8)
          : [];
        const rawPrice = Number(s.priceInr);
        const priceInr =
          Number.isFinite(rawPrice) && rawPrice >= 0
            ? Math.min(10_000_000, Math.round(rawPrice))
            : 2999;

        return {
          id: pickStr(s.id, `service-${idx + 1}`, 60).replace(/[^a-zA-Z0-9_-]/g, "-"),
          number: pickStr(s.number, `${String(idx + 1).padStart(2, "0")} /`, 16),
          title: pickStr(s.title, `Service ${idx + 1}`, 80),
          description: pickStr(s.description, "", 320),
          timeline: pickStr(s.timeline, "3–7 days delivery", 80),
          priceInr,
          requiresPlotDetails:
            typeof s.requiresPlotDetails === "boolean"
              ? s.requiresPlotDetails
              : true,
          deliverables: deliverables.length
            ? deliverables
            : ["Consultation & architectural planning"],
          icon,
          enabled: typeof s.enabled === "boolean" ? s.enabled : true,
        };
      })
    : current.services;

  const showcase: ShowcaseItem[] = Array.isArray(raw.showcase)
    ? raw.showcase.slice(0, 8).map((item, idx) => {
        const sc = (item as Record<string, unknown>) || {};
        const preset =
          sc.imagePreset === "residential" ||
          sc.imagePreset === "interior" ||
          sc.imagePreset === "custom"
            ? sc.imagePreset
            : "residential";
        return {
          id: pickStr(sc.id, `showcase-${idx + 1}`, 60).replace(/[^a-zA-Z0-9_-]/g, "-"),
          category: pickStr(sc.category, "ARCHITECTURAL INSPIRATION", 80),
          title: pickStr(sc.title, "Design Reference", 120),
          imagePreset: preset,
          customImageUrl:
            preset === "custom"
              ? sanitizeImageUrl(
                  typeof sc.customImageUrl === "string"
                    ? sc.customImageUrl
                    : undefined
                )
              : undefined,
          alt: pickStr(sc.alt, "Architectural reference image", 200),
          studyNote: pickStr(sc.studyNote, "", 400),
          focusAreas: pickStr(sc.focusAreas, "", 160),
        };
      })
    : current.showcase;

  const disciplines = Array.isArray(rawPractice.disciplines)
    ? rawPractice.disciplines
        .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
        .map((d) => d.trim().slice(0, 40))
        .slice(0, 8)
    : current.practice.disciplines;

  const rawEmail = pickStr(rawBrand.contactEmail, current.brand.contactEmail, 120);
  const safeContactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)
    ? rawEmail
    : current.brand.contactEmail;

  const styleCandidate = rawBilling.receiptStyle as ReceiptStyleMode;
  const receiptStyle: ReceiptStyleMode = ALLOWED_RECEIPT_STYLES.has(styleCandidate)
    ? styleCandidate
    : current.billing.receiptStyle;

  const sanitized: SiteConfig = {
    brand: {
      name: pickStr(rawBrand.name, current.brand.name, 80),
      tagline: pickStr(rawBrand.tagline, current.brand.tagline, 160),
      contactEmail: safeContactEmail,
      emailNotice: pickStr(rawBrand.emailNotice, current.brand.emailNotice, 240),
      copyright: pickStr(rawBrand.copyright, current.brand.copyright, 160),
      logoDataUrl: nextLogoDataUrl,
    },
    hero: {
      kickerLeft: pickStr(rawHero.kickerLeft, current.hero.kickerLeft, 80),
      kickerRight: pickStr(rawHero.kickerRight, current.hero.kickerRight, 80),
      headline: pickStr(rawHero.headline, current.hero.headline, 140),
      subheading: pickStr(rawHero.subheading, current.hero.subheading, 360),
      primaryCta: pickStr(rawHero.primaryCta, current.hero.primaryCta, 50),
      secondaryCta: pickStr(rawHero.secondaryCta, current.hero.secondaryCta, 50),
      footnote: pickStr(rawHero.footnote, current.hero.footnote, 120),
      modelMottoLeft: pickStr(rawHero.modelMottoLeft, current.hero.modelMottoLeft, 30),
      modelMottoCenter: pickStr(
        rawHero.modelMottoCenter,
        current.hero.modelMottoCenter,
        30
      ),
      modelMottoRight: pickStr(
        rawHero.modelMottoRight,
        current.hero.modelMottoRight,
        30
      ),
    },
    servicesSection: {
      kicker: pickStr(rawServicesSec.kicker, current.servicesSection.kicker, 60),
      headline: pickStr(rawServicesSec.headline, current.servicesSection.headline, 140),
      subtitle: pickStr(rawServicesSec.subtitle, current.servicesSection.subtitle, 260),
    },
    services: services.length ? services : DEFAULT_SITE_CONFIG.services,
    showcaseSection: {
      kicker: pickStr(rawShowcaseSec.kicker, current.showcaseSection.kicker, 60),
      headline: pickStr(rawShowcaseSec.headline, current.showcaseSection.headline, 140),
      subtitle: pickStr(rawShowcaseSec.subtitle, current.showcaseSection.subtitle, 260),
      disclaimer: pickStr(
        rawShowcaseSec.disclaimer,
        current.showcaseSection.disclaimer,
        240
      ),
    },
    showcase: showcase.length ? showcase : DEFAULT_SITE_CONFIG.showcase,
    practice: {
      kicker: pickStr(rawPractice.kicker, current.practice.kicker, 60),
      headline: pickStr(rawPractice.headline, current.practice.headline, 140),
      paragraph1: pickStr(rawPractice.paragraph1, current.practice.paragraph1, 600),
      paragraph2: pickStr(rawPractice.paragraph2, current.practice.paragraph2, 600),
      visualCaption: pickStr(
        rawPractice.visualCaption,
        current.practice.visualCaption,
        80
      ),
      disciplines: disciplines.length ? disciplines : current.practice.disciplines,
    },
    contact: {
      kicker: pickStr(rawContact.kicker, current.contact.kicker, 80),
      headline: pickStr(rawContact.headline, current.contact.headline, 140),
      subtitle: pickStr(rawContact.subtitle, current.contact.subtitle, 240),
      ctaLabel: pickStr(rawContact.ctaLabel, current.contact.ctaLabel, 60),
    },
    billing: {
      receiptStyle,
      templateImageDataUrl: nextReceiptTemplate,
      studioAddress: pickStr(
        rawBilling.studioAddress,
        current.billing.studioAddress,
        260
      ),
      gstOrRegNo: pickOptionalStr(
        rawBilling.gstOrRegNo,
        current.billing.gstOrRegNo,
        120
      ),
      signatoryName: pickStr(
        rawBilling.signatoryName,
        current.billing.signatoryName,
        120
      ),
      footerNote: pickStr(rawBilling.footerNote, current.billing.footerNote, 320),
    },
    payment: {
      currency: "INR",
      upiEnabled:
        typeof rawPayment.upiEnabled === "boolean"
          ? rawPayment.upiEnabled
          : current.payment.upiEnabled,
      upiId: pickOptionalStr(rawPayment.upiId, current.payment.upiId, 120),
      upiMerchantName: pickStr(
        rawPayment.upiMerchantName,
        current.payment.upiMerchantName,
        100
      ),
      upiQrDataUrl: nextUpiQr,
      razorpayEnabled:
        typeof rawPayment.razorpayEnabled === "boolean"
          ? rawPayment.razorpayEnabled
          : current.payment.razorpayEnabled,
      razorpayKeyId: pickOptionalStr(
        rawPayment.razorpayKeyId,
        current.payment.razorpayKeyId,
        120
      ),
      bankEnabled:
        typeof rawPayment.bankEnabled === "boolean"
          ? rawPayment.bankEnabled
          : current.payment.bankEnabled,
      bankDetails: pickOptionalStr(
        rawPayment.bankDetails,
        current.payment.bankDetails,
        400
      ),
      payLaterEnabled:
        typeof rawPayment.payLaterEnabled === "boolean"
          ? rawPayment.payLaterEnabled
          : current.payment.payLaterEnabled,
    },
  };

  const saved = await saveSiteConfig(sanitized);
  return secureJson({ config: saved });
}
