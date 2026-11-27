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
      id: "architecture",
      number: "01 /",
      title: "Architecture",
      description:
        "Distinctive residential and commercial spaces grounded in context and everyday use.",
      timeline: "6–14 weeks design phase",
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
      number: "02 /",
      title: "Interior Design",
      description:
        "Considered interiors that bring material, light, and human experience together.",
      timeline: "4–10 weeks design phase",
      deliverables: [
        "Spatial zoning, circulation & lighting mood",
        "Bespoke joinery, finishes & material palettes",
        "Furniture curation & styling direction",
      ],
      icon: "grid",
      enabled: true,
    },
    {
      id: "planning-design",
      number: "03 /",
      title: "Planning & Design",
      description:
        "Practical space planning and design development for a confident project journey.",
      timeline: "3–6 weeks planning phase",
      deliverables: [
        "Functional floor layouts & feasibility studies",
        "Regulatory alignment & build phasing",
        "Technical detailing for seamless execution",
      ],
      icon: "ruler",
      enabled: true,
    },
    {
      id: "3d-visualization",
      number: "04 /",
      title: "3D Visualization",
      description:
        "Immersive visual studies that make ideas easier to see, discuss, and refine.",
      timeline: "1–3 weeks visualization sprint",
      deliverables: [
        "Photorealistic exterior & interior renders",
        "Daylight, shadow & material comparisons",
        "Client walkthrough frames before construction",
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
