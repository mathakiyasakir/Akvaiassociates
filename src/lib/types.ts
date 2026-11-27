export type UserRole = "admin" | "user";

export type ServiceIconKey =
  | "building"
  | "grid"
  | "ruler"
  | "box"
  | "compass"
  | "layers"
  | "pentool"
  | "home";

export type OrderStatus =
  | "Pending"
  | "In Review"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  description: string;
  timeline: string;
  deliverables: string[];
  icon: ServiceIconKey;
  enabled: boolean;
}

export interface ShowcaseItem {
  id: string;
  category: string;
  title: string;
  imagePreset: "residential" | "interior" | "custom";
  customImageUrl?: string;
  alt: string;
  studyNote: string;
  focusAreas: string;
}

export interface SiteConfig {
  brand: {
    name: string;
    tagline: string;
    contactEmail: string;
    emailNotice: string;
    copyright: string;
  };
  hero: {
    kickerLeft: string;
    kickerRight: string;
    headline: string;
    subheading: string;
    primaryCta: string;
    secondaryCta: string;
    footnote: string;
    modelMottoLeft: string;
    modelMottoCenter: string;
    modelMottoRight: string;
  };
  servicesSection: {
    kicker: string;
    headline: string;
    subtitle: string;
  };
  services: ServiceItem[];
  showcaseSection: {
    kicker: string;
    headline: string;
    subtitle: string;
    disclaimer: string;
  };
  showcase: ShowcaseItem[];
  practice: {
    kicker: string;
    headline: string;
    paragraph1: string;
    paragraph2: string;
    visualCaption: string;
    disciplines: string[];
  };
  contact: {
    kicker: string;
    headline: string;
    subtitle: string;
    ctaLabel: string;
  };
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface StoredUser extends PublicUser {
  passwordHash: string;
}

export interface OrderItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceTitle: string;
  projectType: string;
  location: string;
  budgetRange: string;
  message: string;
  status: OrderStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface MongoStatus {
  connected: boolean;
  source: "env" | "runtime" | "local";
  maskedHost: string | null;
  dbName: string;
  latencyMs: number | null;
  lastError: string | null;
  counts: {
    users: number;
    orders: number;
    services: number;
  };
}

export interface PortalSecurityStatus {
  activeSlug: string;
  portalPath: string;
  slugControlledByEnv: boolean;
  passwordControlledByEnv: boolean;
}
