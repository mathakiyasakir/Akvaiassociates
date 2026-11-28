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
  | "Revision Requested"
  | "Completed"
  | "Cancelled";

export type PaymentMethod =
  | "UPI"
  | "Razorpay"
  | "Bank Transfer"
  | "Pay on Confirmation"
  | "Demo Test";

export type PaymentStatus = "Paid" | "Verification Pending" | "Unpaid";

export type ReceiptStyleMode =
  | "architectural"
  | "minimal"
  | "custom-template";

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  description: string;
  timeline: string;
  priceInr: number;
  requiresPlotDetails: boolean;
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

export interface BillingConfig {
  receiptStyle: ReceiptStyleMode;
  templateImageDataUrl?: string;
  studioAddress: string;
  gstOrRegNo: string;
  signatoryName: string;
  footerNote: string;
}

export interface PublicPaymentConfig {
  currency: "INR";
  upiEnabled: boolean;
  upiId: string;
  upiMerchantName: string;
  upiQrDataUrl?: string;
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  bankEnabled: boolean;
  bankDetails: string;
  payLaterEnabled: boolean;
}

export interface SiteConfig {
  brand: {
    name: string;
    tagline: string;
    contactEmail: string;
    emailNotice: string;
    copyright: string;
    logoDataUrl?: string;
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
  billing: BillingConfig;
  payment: PublicPaymentConfig;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified?: boolean;
  isDemoTester?: boolean;
  createdAt: string;
}

export interface StoredUser extends PublicUser {
  passwordHash: string;
}

export interface PlotDetails {
  length: string;
  width: string;
  unit: "ft" | "m";
  areaSq: string;
  northSide: string;
  floors: string;
  sketchImageDataUrl?: string;
  sketchFileName?: string;
}

export interface OrderPaymentInfo {
  amountInr: number;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceId: string;
  paidAt: string;
}

export interface OrderDeliverablePdf {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  pdfDataUrl: string;
  uploadedAt: string;
  note?: string;
}

export interface OrderReview {
  rating: number;
  comment: string;
  createdAt: string;
}

export interface OrderRevisionRequest {
  id: string;
  note: string;
  createdAt: string;
  resolved?: boolean;
}

export interface OrderItem {
  id: string;
  invoiceNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId?: string;
  serviceTitle: string;
  projectType: string;
  location: string;
  budgetRange: string;
  message: string;
  plotDetails?: PlotDetails;
  payment: OrderPaymentInfo;
  deliverables: OrderDeliverablePdf[];
  review?: OrderReview;
  revisions: OrderRevisionRequest[];
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

export interface SmtpStatus {
  configured: boolean;
  source: "env" | "runtime" | "none";
  host: string | null;
  port: number | null;
  maskedUser: string | null;
  fromAddress: string | null;
  verifiedAt: string | null;
  lastError: string | null;
}

export interface PaymentGatewayAdminStatus {
  razorpaySecretConfigured: boolean;
  razorpaySource: "env" | "runtime" | "none";
  maskedRazorpayKeyId: string | null;
}
