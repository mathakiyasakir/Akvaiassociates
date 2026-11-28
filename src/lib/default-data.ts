import type { SiteConfig } from "@/lib/types";

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brand: {
    name: "AKVAI ASSOCIATES",
    tagline: "Architecture with intention.",
    contactEmail: "hello@akvaiassociates.com",
    emailNotice:
      "Example contact address — replace with your verified business email before publishing.",
    copyright: "© 2026 Akvai Associates. All rights reserved.",
  },
  hero: {
    kickerLeft: "AKVAI ASSOCIATES",
    kickerRight: "ARCHITECTURAL PRACTICE",
    headline: "Spaces shaped for the way you live.",
    subheading:
      "Thoughtful architecture from the first sketch to the final detail. We bring clarity, character, and purpose to every space.",
    primaryCta: "Explore services",
    secondaryCta: "View our approach",
    footnote: "Designed with intention. Built for living.",
    modelMottoLeft: "FORM",
    modelMottoCenter: "FUNCTION",
    modelMottoRight: "FEELING",
  },
  servicesSection: {
    kicker: "WHAT WE DO",
    headline: "Every detail has a purpose.",
    subtitle:
      "Connected architectural services to guide your idea from possibility to place.",
  },
  services: [
    {
      id: "2d-layout-plan",
      number: "01 /",
      title: "2D Layout Plan",
      description:
        "Precision furniture & Vastu-aligned 2D floor plans tailored to your exact plot dimensions, north orientation, and room requirements.",
      timeline: "2–4 days delivery",
      priceInr: 2999,
      requiresPlotDetails: true,
      deliverables: [
        "Detailed 2D floor plan PDF with room dimensions",
        "North orientation, ventilation & circulation zoning",
        "Furniture layout & 1 free design revision",
      ],
      icon: "ruler",
      enabled: true,
    },
    {
      id: "architecture",
      number: "02 /",
      title: "Architecture",
      description:
        "Distinctive residential and commercial spaces grounded in context and everyday use.",
      timeline: "2–4 weeks design phase",
      priceInr: 9999,
      requiresPlotDetails: true,
      deliverables: [
        "Site analysis, massing & schematic concepts",
        "Architectural working drawings & elevations",
        "Material specification & site coordination",
      ],
      icon: "building",
      enabled: true,
    },
    {
      id: "interior-design",
      number: "03 /",
      title: "Interior Design",
      description:
        "Considered interiors that bring material, light, and human experience together.",
      timeline: "1–3 weeks design phase",
      priceInr: 7999,
      requiresPlotDetails: true,
      deliverables: [
        "Spatial zoning, circulation & lighting mood",
        "Bespoke joinery, finishes & material palettes",
        "Furniture curation & styling direction",
      ],
      icon: "grid",
      enabled: true,
    },
    {
      id: "3d-visualization",
      number: "04 /",
      title: "3D Visualization",
      description:
        "Immersive visual studies that make ideas easier to see, discuss, and refine before construction.",
      timeline: "4–7 days visualization sprint",
      priceInr: 5999,
      requiresPlotDetails: true,
      deliverables: [
        "Photorealistic exterior & interior 3D renders",
        "Daylight, shadow & material comparisons",
        "High-resolution PDF presentation sheets",
      ],
      icon: "box",
      enabled: true,
    },
  ],
  showcaseSection: {
    kicker: "DESIGN IN PERSPECTIVE",
    headline: "A closer look at possibility.",
    subtitle:
      "Visual references to the forms, textures, and spaces that inspire our practice.",
    disclaimer:
      "Imagery shown is design inspiration, not a portfolio of completed Akvai projects.",
  },
  showcase: [
    {
      id: "residential",
      category: "RESIDENTIAL INSPIRATION",
      title: "A new way to feel at home",
      imagePreset: "residential",
      alt: "Contemporary architectural residence featuring crisp white volumes, dark timber cladding, and cantilevered glass balconies",
      studyNote:
        "Clean cantilevered planes, deep overhangs for natural shading, and generous corner glazing connect living volumes directly to sky and landscape.",
      focusAreas: "Massing · Cantilevered Balconies · Natural Shading",
    },
    {
      id: "interior",
      category: "INTERIOR INSPIRATION",
      title: "Spaces with room to breathe",
      imagePreset: "interior",
      alt: "Sunlit minimalist bedroom interior with warm oak wood flooring, textured linen bedding, woven wooden screen, and indoor greenery",
      studyNote:
        "Tactile natural timber, breathable linen surfaces, and calibrated afternoon daylight create a calm domestic rhythm without visual noise.",
      focusAreas: "Daylighting · Material Honesty · Calm Proportion",
    },
  ],
  practice: {
    kicker: "THE PRACTICE",
    headline: "Architecture begins with listening.",
    paragraph1:
      "At Akvai Associates, we believe a well-designed space should feel as good as it looks. Each project begins with understanding the people, place, and possibilities behind it.",
    paragraph2:
      "Our approach brings architectural thinking, careful planning, and a strong visual perspective together to shape spaces with lasting relevance.",
    visualCaption: "IDEAS INTO PLACE.",
    disciplines: ["RESIDENTIAL", "COMMERCIAL", "INTERIORS", "3D STUDIES"],
  },
  contact: {
    kicker: "YOUR NEXT SPACE STARTS HERE",
    headline: "Have an idea worth building?",
    subtitle: "Tell us what you have in mind and start the conversation.",
    ctaLabel: "Enquire by email",
  },
  billing: {
    receiptStyle: "architectural",
    studioAddress: "Akvai Associates Studio, Architecture & Interior Practice, India",
    gstOrRegNo: "COA / Studio Reg. Pending Update",
    signatoryName: "Principal Architect, Akvai Associates",
    footerNote:
      "Thank you for commissioning Akvai Associates. Final architectural PDFs are delivered inside your Orders portal upon completion.",
  },
  payment: {
    currency: "INR",
    upiEnabled: true,
    upiId: "akvaiassociates@upi",
    upiMerchantName: "Akvai Associates",
    razorpayEnabled: false,
    razorpayKeyId: "",
    bankEnabled: false,
    bankDetails: "",
    payLaterEnabled: true,
  },
};

export function sanitizeImageUrl(url?: string): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function sanitizeImageDataUrl(
  raw: unknown,
  maxBytes = 2_500_000,
  pngOnly = false
): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const pattern = pngOnly
    ? /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/
    : /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/;

  const match = pattern.exec(trimmed);
  if (!match) return undefined;

  const base64Body = pngOnly ? match[1] : match[2];
  if (!base64Body) return undefined;

  const estimatedBytes = Math.floor((base64Body.length * 3) / 4);
  if (estimatedBytes > maxBytes) return undefined;

  // Validate magic bytes so spoofed HTML/SVG payloads are rejected
  try {
    const head = Buffer.from(base64Body.slice(0, 32), "base64");
    const isPng =
      head.length >= 8 &&
      head[0] === 0x89 &&
      head[1] === 0x50 &&
      head[2] === 0x4e &&
      head[3] === 0x47;
    const isJpeg =
      head.length >= 3 &&
      head[0] === 0xff &&
      head[1] === 0xd8 &&
      head[2] === 0xff;
    const isWebp =
      head.length >= 12 &&
      head.subarray(0, 4).toString("ascii") === "RIFF" &&
      head.subarray(8, 12).toString("ascii") === "WEBP";

    if (pngOnly) {
      return isPng ? trimmed : undefined;
    }
    if (!isPng && !isJpeg && !isWebp) {
      return undefined;
    }
    return trimmed;
  } catch {
    return undefined;
  }
}

export function sanitizePdfDataUrl(
  raw: unknown,
  maxBytes = 4_500_000
): { dataUrl: string; sizeBytes: number } | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  const match = /^data:application\/pdf;base64,([A-Za-z0-9+/=]+)$/.exec(trimmed);
  if (!match || !match[1]) return undefined;

  const base64Body = match[1];
  const sizeBytes = Math.floor((base64Body.length * 3) / 4);
  if (sizeBytes <= 0 || sizeBytes > maxBytes) return undefined;

  try {
    const head = Buffer.from(base64Body.slice(0, 16), "base64").toString("ascii");
    if (!head.startsWith("%PDF-")) return undefined;
    return { dataUrl: trimmed, sizeBytes };
  } catch {
    return undefined;
  }
}
