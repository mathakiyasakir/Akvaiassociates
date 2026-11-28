import crypto from "crypto";
import { MongoClient, type Db } from "mongodb";
import { DEFAULT_SITE_CONFIG } from "@/lib/default-data";
import type {
  MongoStatus,
  OrderDeliverablePdf,
  OrderItem,
  OrderPaymentInfo,
  OrderRevisionRequest,
  OrderStatus,
  PaymentGatewayAdminStatus,
  PaymentStatus,
  PlotDetails,
  PublicUser,
  SiteConfig,
  StoredUser,
  UserRole,
} from "@/lib/types";

interface RuntimeState {
  siteConfig: SiteConfig;
  users: StoredUser[];
  orders: OrderItem[];
  customAdminSlug: string | null;
  razorpayKeySecret: string | null;
  mongoClient: MongoClient | null;
  mongoDb: Db | null;
  mongoSource: "env" | "runtime" | "local";
  mongoMaskedHost: string | null;
  mongoDbName: string;
  mongoLatencyMs: number | null;
  mongoLastError: string | null;
  envConnectAttempted: boolean;
}

const globalForStore = globalThis as unknown as {
  __akvaiStoreState?: RuntimeState;
};

const RESERVED_SLUGS = new Set([
  "admin",
  "login",
  "owner-setup",
  "dashboard",
  "panel",
  "api",
  "auth",
]);

export const ONE_TIME_SETUP_SLUG = "owner-setup";

function getState(): RuntimeState {
  if (!globalForStore.__akvaiStoreState) {
    globalForStore.__akvaiStoreState = {
      siteConfig: structuredClone(DEFAULT_SITE_CONFIG),
      users: [],
      orders: [],
      customAdminSlug: null,
      razorpayKeySecret: null,
      mongoClient: null,
      mongoDb: null,
      mongoSource: "local",
      mongoMaskedHost: null,
      mongoDbName: process.env.MONGODB_DB_NAME?.trim() || "akvai_associates",
      mongoLatencyMs: null,
      mongoLastError: null,
      envConnectAttempted: false,
    };
  }
  return globalForStore.__akvaiStoreState;
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function validateCustomSlug(slug: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  if (typeof slug !== "string") {
    return { valid: false, error: "Secret URL slug must be a string." };
  }
  const normalized = slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized.length < 4 || normalized.length > 64 || !/^[a-z0-9][a-z0-9-]{2,62}[a-z0-9]$/.test(normalized)) {
    return {
      valid: false,
      error:
        "Secret URL slug must be 4–64 characters using lowercase letters, numbers, and hyphens only.",
    };
  }
  if (RESERVED_SLUGS.has(normalized)) {
    return {
      valid: false,
      error: "Choose a unique private slug instead of a common word like 'admin' or 'owner-setup'.",
    };
  }
  return { valid: true, normalized };
}

export function validateMongoUri(rawUri: string): {
  valid: boolean;
  uri?: string;
  maskedHost?: string;
  error?: string;
} {
  if (typeof rawUri !== "string") {
    return { valid: false, error: "MongoDB URI must be a string." };
  }
  const trimmed = rawUri.trim();
  if (!trimmed.startsWith("mongodb://") && !trimmed.startsWith("mongodb+srv://")) {
    return {
      valid: false,
      error: "Connection string must start with mongodb+srv:// or mongodb://",
    };
  }

  try {
    const normalizedForParse = trimmed
      .replace(/^mongodb\+srv:\/\//, "https://")
      .replace(/^mongodb:\/\//, "http://");
    const parsed = new URL(normalizedForParse);
    const host = parsed.hostname.toLowerCase();

    if (!host) {
      return { valid: false, error: "Invalid MongoDB host name." };
    }
    const isBlockedHost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host === "[::1]" ||
      host === "169.254.169.254" ||
      host === "metadata.google.internal" ||
      host.startsWith("169.254.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

    if (isBlockedHost) {
      return {
        valid: false,
        error:
          "Private, loopback, and metadata host addresses are not permitted. Use a public MongoDB Atlas host.",
      };
    }

    return {
      valid: true,
      uri: trimmed,
      maskedHost: host,
    };
  } catch {
    return {
      valid: false,
      error: "Invalid MongoDB connection string format.",
    };
  }
}

export function buildMongoUriFromCluster(params: {
  clusterId: string;
  username: string;
  password: string;
  dbName?: string;
}): { valid: boolean; uri?: string; error?: string } {
  const cluster = params.clusterId
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const username = params.username.trim();
  const password = params.password;
  const dbName = (params.dbName || "akvai_associates").trim() || "akvai_associates";

  if (!cluster) {
    return { valid: false, error: "Please enter your MongoDB Cluster ID or host." };
  }
  if (!username || !password) {
    return { valid: false, error: "Please enter both MongoDB username and password." };
  }

  const host = cluster.includes(".") ? cluster : `${cluster}.mongodb.net`;
  const encodedUser = encodeURIComponent(username);
  const encodedPass = encodeURIComponent(password);
  const encodedDb = encodeURIComponent(dbName);
  const uri = `mongodb+srv://${encodedUser}:${encodedPass}@${host}/${encodedDb}?retryWrites=true&w=majority`;
  return { valid: true, uri };
}

async function ensureEnvMongoConnected(): Promise<void> {
  const state = getState();
  if (state.mongoDb || state.envConnectAttempted) return;
  state.envConnectAttempted = true;

  const envUri = process.env.MONGODB_URI?.trim();
  if (!envUri) return;

  try {
    await connectMongoDatabase(
      envUri,
      process.env.MONGODB_DB_NAME?.trim() || "akvai_associates",
      "env"
    );
  } catch (error) {
    state.mongoLastError =
      error instanceof Error ? error.message : "Failed to connect via MONGODB_URI";
  }
}

export function isMongoConnected(): boolean {
  return Boolean(getState().mongoDb);
}

async function getActiveDb(): Promise<Db | null> {
  await ensureEnvMongoConnected();
  return getState().mongoDb;
}

export async function connectMongoDatabase(
  rawUri: string,
  dbNameInput?: string,
  source: "env" | "runtime" = "runtime"
): Promise<MongoStatus> {
  const state = getState();
  const validation = validateMongoUri(rawUri);
  if (!validation.valid || !validation.uri || !validation.maskedHost) {
    throw new Error(validation.error || "Invalid MongoDB connection string.");
  }

  const dbName = (dbNameInput?.trim() || "akvai_associates").replace(
    /[^a-zA-Z0-9_-]/g,
    "_"
  );

  const client = new MongoClient(validation.uri, {
    serverSelectionTimeoutMS: 6000,
    connectTimeoutMS: 6000,
  });

  const startedAt = Date.now();
  await client.connect();
  const db = client.db(dbName);
  await db.command({ ping: 1 });
  const latencyMs = Date.now() - startedAt;

  if (state.mongoClient) {
    try {
      await state.mongoClient.close();
    } catch {
      // Ignore close errors
    }
  }

  state.mongoClient = client;
  state.mongoDb = db;
  state.mongoSource = source;
  state.mongoMaskedHost = validation.maskedHost;
  state.mongoDbName = dbName;
  state.mongoLatencyMs = latencyMs;
  state.mongoLastError = null;

  await syncMemoryToMongo(db);

  return getMongoStatus();
}

async function syncMemoryToMongo(db: Db): Promise<void> {
  const state = getState();
  const configCol = db.collection<{ _id: string; config?: SiteConfig; slug?: string }>(
    "site_config"
  );
  const existingConfig = await configCol.findOne({ _id: "primary" });
  if (!existingConfig?.config) {
    await configCol.updateOne(
      { _id: "primary" },
      { $set: { config: state.siteConfig } },
      { upsert: true }
    );
  } else {
    state.siteConfig = existingConfig.config;
  }

  const existingPortal = await configCol.findOne({ _id: "admin_portal" });
  if (existingPortal?.slug) {
    state.customAdminSlug = existingPortal.slug;
  } else if (state.customAdminSlug) {
    await configCol.updateOne(
      { _id: "admin_portal" },
      { $set: { slug: state.customAdminSlug } },
      { upsert: true }
    );
  }

  const usersCol = db.collection<StoredUser>("users");
  for (const user of state.users) {
    const existing = await usersCol.findOne({ email: user.email });
    if (!existing) {
      await usersCol.insertOne({ ...user });
    }
  }

  const ordersCol = db.collection<OrderItem>("orders");
  for (const order of state.orders) {
    const existing = await ordersCol.findOne({ id: order.id });
    if (!existing) {
      await ordersCol.insertOne({ ...order });
    }
  }
}

export async function disconnectMongoDatabase(): Promise<MongoStatus> {
  const state = getState();
  if (state.mongoClient) {
    try {
      await state.mongoClient.close();
    } catch {
      // Ignore close error
    }
  }
  state.mongoClient = null;
  state.mongoDb = null;
  state.mongoSource = "local";
  state.mongoMaskedHost = null;
  state.mongoLatencyMs = null;
  state.mongoLastError = null;
  return getMongoStatus();
}

export async function getMongoStatus(): Promise<MongoStatus> {
  await ensureEnvMongoConnected();
  const state = getState();
  const db = state.mongoDb;

  if (db) {
    try {
      const started = Date.now();
      await db.command({ ping: 1 });
      const latencyMs = Date.now() - started;
      const [usersCount, ordersCount, configDoc] = await Promise.all([
        db.collection("users").countDocuments(),
        db.collection("orders").countDocuments(),
        db
          .collection<{ _id: string; config: SiteConfig }>("site_config")
          .findOne({ _id: "primary" }),
      ]);
      state.mongoLatencyMs = latencyMs;
      return {
        connected: true,
        source: state.mongoSource,
        maskedHost: state.mongoMaskedHost,
        dbName: state.mongoDbName,
        latencyMs,
        lastError: null,
        counts: {
          users: usersCount,
          orders: ordersCount,
          services:
            configDoc?.config?.services?.length ??
            state.siteConfig.services.length,
        },
      };
    } catch (error) {
      state.mongoLastError =
        error instanceof Error ? error.message : "MongoDB ping failed";
    }
  }

  return {
    connected: false,
    source: "local",
    maskedHost: state.mongoMaskedHost,
    dbName: state.mongoDbName,
    latencyMs: null,
    lastError: state.mongoLastError,
    counts: {
      users: state.users.length,
      orders: state.orders.length,
      services: state.siteConfig.services.length,
    },
  };
}

// --- Hidden Dynamic Admin URL Control ---

export function isEnvSlugConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_SECRET_SLUG && process.env.ADMIN_SECRET_SLUG.trim().length >= 6
  );
}

export async function getConfiguredAdminSlug(): Promise<string | null> {
  if (isEnvSlugConfigured()) {
    return process.env.ADMIN_SECRET_SLUG!.trim().toLowerCase();
  }
  const state = getState();
  const db = await getActiveDb();
  if (db) {
    const doc = await db
      .collection<{ _id: string; slug?: string }>("site_config")
      .findOne({ _id: "admin_portal" });
    if (doc?.slug) {
      state.customAdminSlug = doc.slug;
      return doc.slug;
    }
  }
  return state.customAdminSlug;
}

export async function saveCustomAdminSlug(slug: string): Promise<string> {
  const checked = validateCustomSlug(slug);
  if (!checked.valid || !checked.normalized) {
    throw new Error(checked.error || "Invalid secret URL slug.");
  }
  const state = getState();
  state.customAdminSlug = checked.normalized;
  const db = await getActiveDb();
  if (db) {
    await db
      .collection<{ _id: string; slug: string }>("site_config")
      .updateOne(
        { _id: "admin_portal" },
        { $set: { slug: checked.normalized } },
        { upsert: true }
      );
  }
  return checked.normalized;
}

export async function verifyPortalSlugAccess(
  candidate: string
): Promise<{ allowed: boolean; mode: "setup" | "portal" | "denied" }> {
  const normalized = typeof candidate === "string" ? candidate.trim().toLowerCase() : "";
  if (!normalized) return { allowed: false, mode: "denied" };

  const configuredSlug = await getConfiguredAdminSlug();
  const setupRequired = await isFirstRunSetupRequired();

  // Case 1: ADMIN_SECRET_SLUG env var OR claimed custom slug is set
  if (configuredSlug) {
    if (safeCompare(normalized, configuredSlug)) {
      return {
        allowed: true,
        mode: setupRequired ? "setup" : "portal",
      };
    }
    return { allowed: false, mode: "denied" };
  }

  // Case 2: No slug configured yet -> allow /portal/owner-setup
  // (setup mode if no admin exists yet; portal login mode if ADMIN_PASSWORD env is set without ADMIN_SECRET_SLUG)
  if (safeCompare(normalized, ONE_TIME_SETUP_SLUG)) {
    return { allowed: true, mode: setupRequired ? "setup" : "portal" };
  }

  return { allowed: false, mode: "denied" };
}

// --- Site Configuration & Payment Gateway Secrets ---

function hydrateSiteConfig(raw?: Partial<SiteConfig> | null): SiteConfig {
  const base = structuredClone(DEFAULT_SITE_CONFIG);
  if (!raw) return base;

  const services = Array.isArray(raw.services) && raw.services.length > 0
    ? raw.services.map((s, idx) => ({
        ...s,
        priceInr:
          typeof s.priceInr === "number" && Number.isFinite(s.priceInr) && s.priceInr >= 0
            ? Math.round(s.priceInr)
            : base.services[idx]?.priceInr ?? 2999,
        requiresPlotDetails:
          typeof s.requiresPlotDetails === "boolean" ? s.requiresPlotDetails : true,
      }))
    : base.services;

  const envRzpKey = process.env.RAZORPAY_KEY_ID?.trim();

  return {
    brand: { ...base.brand, ...(raw.brand || {}) },
    hero: { ...base.hero, ...(raw.hero || {}) },
    servicesSection: { ...base.servicesSection, ...(raw.servicesSection || {}) },
    services,
    showcaseSection: { ...base.showcaseSection, ...(raw.showcaseSection || {}) },
    showcase: Array.isArray(raw.showcase) && raw.showcase.length > 0 ? raw.showcase : base.showcase,
    practice: { ...base.practice, ...(raw.practice || {}) },
    contact: { ...base.contact, ...(raw.contact || {}) },
    billing: { ...base.billing, ...(raw.billing || {}) },
    payment: {
      ...base.payment,
      ...(raw.payment || {}),
      razorpayKeyId: raw.payment?.razorpayKeyId || envRzpKey || "",
    },
  };
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const state = getState();
  const db = await getActiveDb();
  if (db) {
    const doc = await db
      .collection<{ _id: string; config: SiteConfig }>("site_config")
      .findOne({ _id: "primary" });
    if (doc?.config) {
      state.siteConfig = hydrateSiteConfig(doc.config);
      return state.siteConfig;
    }
  }
  state.siteConfig = hydrateSiteConfig(state.siteConfig);
  return state.siteConfig;
}

export async function saveSiteConfig(nextConfig: SiteConfig): Promise<SiteConfig> {
  const state = getState();
  const hydrated = hydrateSiteConfig(nextConfig);
  state.siteConfig = hydrated;
  const db = await getActiveDb();
  if (db) {
    await db
      .collection<{ _id: string; config: SiteConfig }>("site_config")
      .updateOne(
        { _id: "primary" },
        { $set: { config: hydrated } },
        { upsert: true }
      );
  }
  return hydrated;
}

export function getRazorpayCredentials(): {
  keyId: string | null;
  keySecret: string | null;
  source: "env" | "runtime" | "none";
} {
  const envId = process.env.RAZORPAY_KEY_ID?.trim();
  const envSecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (envId && envSecret) {
    return { keyId: envId, keySecret: envSecret, source: "env" };
  }
  const state = getState();
  const runtimeId = state.siteConfig.payment?.razorpayKeyId?.trim();
  const runtimeSecret = state.razorpayKeySecret?.trim();
  if (runtimeId && runtimeSecret) {
    return { keyId: runtimeId, keySecret: runtimeSecret, source: "runtime" };
  }
  return { keyId: envId || runtimeId || null, keySecret: null, source: "none" };
}

export function setRuntimeRazorpaySecret(secret: string | null): void {
  const state = getState();
  state.razorpayKeySecret = secret && secret.trim() ? secret.trim() : null;
}

export function getPaymentGatewayAdminStatus(): PaymentGatewayAdminStatus {
  const creds = getRazorpayCredentials();
  const keyId = creds.keyId;
  const masked = keyId
    ? `${keyId.slice(0, Math.min(8, keyId.length))}****${keyId.slice(-4)}`
    : null;
  return {
    razorpaySecretConfigured: Boolean(creds.keyId && creds.keySecret),
    razorpaySource: creds.source,
    maskedRazorpayKeyId: masked,
  };
}

// --- Users, Dedicated Test User & Admin Setup ---

export const DEMO_TEST_USER_EMAIL = (
  process.env.DEMO_TEST_USER_EMAIL?.trim() || "akvaiassociates@user.com"
).toLowerCase();

export function getDemoTestUserPassword(): string {
  return process.env.DEMO_TEST_USER_PASSWORD?.trim() || "akvai2026";
}

export function isDemoTesterEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  return email.trim().toLowerCase() === DEMO_TEST_USER_EMAIL;
}

export async function ensureDemoTestUser(
  passwordHash: string
): Promise<StoredUser> {
  const existing = await findUserByEmail(DEMO_TEST_USER_EMAIL);
  if (existing && existing.role === "user") {
    return existing;
  }

  const demoUser: StoredUser = {
    id: "usr_demo_akvai_tester",
    name: "Akvai Test Client",
    email: DEMO_TEST_USER_EMAIL,
    passwordHash,
    role: "user",
    emailVerified: true,
    createdAt: new Date().toISOString(),
  };

  const state = getState();
  if (!state.users.some((u) => u.email === DEMO_TEST_USER_EMAIL)) {
    state.users.unshift(demoUser);
  }

  const db = await getActiveDb();
  if (db) {
    const dbExisting = await db
      .collection<StoredUser>("users")
      .findOne({ email: DEMO_TEST_USER_EMAIL });
    if (!dbExisting) {
      await db.collection<StoredUser>("users").insertOne({ ...demoUser });
    } else {
      return { ...dbExisting };
    }
  }

  return demoUser;
}

export function hasEnvAdminConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length >= 6
  );
}

export function getEnvAdminEmail(): string {
  return (process.env.ADMIN_EMAIL?.trim() || "SMathakiya80@gmail.com").toLowerCase();
}

export async function hasAnyAdminUser(): Promise<boolean> {
  const db = await getActiveDb();
  if (db) {
    const count = await db
      .collection<StoredUser>("users")
      .countDocuments({ role: "admin" });
    return count > 0;
  }
  return getState().users.some((u) => u.role === "admin");
}

export async function isFirstRunSetupRequired(): Promise<boolean> {
  if (hasEnvAdminConfigured()) return false;
  const hasAdmin = await hasAnyAdminUser();
  return !hasAdmin;
}

export async function listPublicUsers(): Promise<PublicUser[]> {
  const db = await getActiveDb();
  const list = db
    ? await db
        .collection<StoredUser>("users")
        .find({})
        .sort({ createdAt: -1 })
        .toArray()
    : getState().users;

  return list.map(({ id, name, email, role, emailVerified, createdAt }) => ({
    id,
    name,
    email,
    role,
    emailVerified,
    createdAt,
  }));
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  const db = await getActiveDb();
  if (db) {
    const doc = await db
      .collection<StoredUser>("users")
      .findOne({ email: normalized });
    return doc ? { ...doc } : null;
  }
  return getState().users.find((u) => u.email === normalized) || null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const db = await getActiveDb();
  if (db) {
    const doc = await db.collection<StoredUser>("users").findOne({ id });
    return doc ? { ...doc } : null;
  }
  return getState().users.find((u) => u.id === id) || null;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  emailVerified?: boolean;
}): Promise<PublicUser> {
  const user: StoredUser = {
    id: `usr_${crypto.randomBytes(8).toString("hex")}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash: input.passwordHash,
    role: input.role,
    emailVerified: Boolean(input.emailVerified),
    createdAt: new Date().toISOString(),
  };

  const state = getState();
  state.users.unshift(user);

  const db = await getActiveDb();
  if (db) {
    await db.collection<StoredUser>("users").insertOne({ ...user });
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<PublicUser | null> {
  const state = getState();
  const db = await getActiveDb();

  if (db) {
    await db
      .collection<StoredUser>("users")
      .updateOne({ id: userId }, { $set: { role } });
    const updated = await db.collection<StoredUser>("users").findOne({ id: userId });
    if (!updated) return null;
    const localIdx = state.users.findIndex((u) => u.id === userId);
    if (localIdx >= 0) state.users[localIdx].role = role;
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      createdAt: updated.createdAt,
    };
  }

  const user = state.users.find((u) => u.id === userId);
  if (!user) return null;
  user.role = role;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function updateUserPasswordHash(
  userId: string,
  passwordHash: string
): Promise<boolean> {
  const state = getState();
  const db = await getActiveDb();

  const localUser = state.users.find((u) => u.id === userId);
  if (localUser) {
    localUser.passwordHash = passwordHash;
  }

  if (db) {
    const res = await db
      .collection<StoredUser>("users")
      .updateOne({ id: userId }, { $set: { passwordHash } });
    return res.matchedCount > 0;
  }
  return Boolean(localUser);
}

export async function deleteUserById(userId: string): Promise<boolean> {
  const state = getState();
  const db = await getActiveDb();
  state.users = state.users.filter((u) => u.id !== userId);
  if (db) {
    const res = await db.collection<StoredUser>("users").deleteOne({ id: userId });
    return res.deletedCount > 0;
  }
  return true;
}

// --- Orders / Enquiries ---

function normalizeOrder(raw: OrderItem): OrderItem {
  return {
    ...raw,
    invoiceNumber: raw.invoiceNumber || `INV-${raw.id.replace("ORD-", "AKV-")}`,
    payment: raw.payment || {
      amountInr: 0,
      method: "Pay on Confirmation",
      status: "Unpaid",
      referenceId: raw.id,
      paidAt: raw.createdAt,
    },
    deliverables: Array.isArray(raw.deliverables) ? raw.deliverables : [],
    revisions: Array.isArray(raw.revisions) ? raw.revisions : [],
  };
}

export async function listOrders(filterUserId?: string): Promise<OrderItem[]> {
  const db = await getActiveDb();
  if (db) {
    const query = filterUserId ? { userId: filterUserId } : {};
    const docs = await db
      .collection<OrderItem>("orders")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(normalizeOrder);
  }
  const all = getState().orders.map(normalizeOrder);
  return filterUserId ? all.filter((o) => o.userId === filterUserId) : all;
}

export async function findOrderById(orderId: string): Promise<OrderItem | null> {
  const db = await getActiveDb();
  if (db) {
    const doc = await db.collection<OrderItem>("orders").findOne({ id: orderId });
    return doc ? normalizeOrder(doc) : null;
  }
  const found = getState().orders.find((o) => o.id === orderId);
  return found ? normalizeOrder(found) : null;
}

export async function createOrder(input: {
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
}): Promise<OrderItem> {
  const now = new Date().toISOString();
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  const order: OrderItem = {
    id: `ORD-${suffix}`,
    invoiceNumber: `INV-AKV-${new Date().getFullYear()}-${suffix}`,
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    serviceId: input.serviceId,
    serviceTitle: input.serviceTitle.trim(),
    projectType: input.projectType.trim() || "Residential",
    location: input.location.trim() || "Not specified",
    budgetRange: input.budgetRange.trim() || "Standard",
    message: input.message.trim(),
    plotDetails: input.plotDetails,
    payment: input.payment,
    deliverables: [],
    revisions: [],
    status: "Pending",
    adminNote: "",
    createdAt: now,
    updatedAt: now,
  };

  const state = getState();
  state.orders.unshift(order);

  const db = await getActiveDb();
  if (db) {
    await db.collection<OrderItem>("orders").insertOne({ ...order });
  }

  return order;
}

export async function updateOrderAdmin(
  orderId: string,
  updates: {
    status?: OrderStatus;
    adminNote?: string;
    paymentStatus?: PaymentStatus;
    addDeliverables?: OrderDeliverablePdf[];
    removeDeliverableId?: string;
    markRevisionsResolved?: boolean;
  }
): Promise<OrderItem | null> {
  const state = getState();
  const now = new Date().toISOString();
  const current = await findOrderById(orderId);
  if (!current) return null;

  let nextDeliverables = [...(current.deliverables || [])];
  if (updates.removeDeliverableId) {
    nextDeliverables = nextDeliverables.filter(
      (d) => d.id !== updates.removeDeliverableId
    );
  }
  if (Array.isArray(updates.addDeliverables) && updates.addDeliverables.length > 0) {
    nextDeliverables = [...nextDeliverables, ...updates.addDeliverables].slice(0, 10);
  }

  const nextPayment: OrderPaymentInfo = {
    ...current.payment,
    ...(updates.paymentStatus ? { status: updates.paymentStatus } : {}),
  };

  const nextRevisions: OrderRevisionRequest[] = updates.markRevisionsResolved
    ? current.revisions.map((r) => ({ ...r, resolved: true }))
    : current.revisions;

  const nextOrder: OrderItem = {
    ...current,
    status: updates.status ?? current.status,
    adminNote:
      typeof updates.adminNote === "string" ? updates.adminNote : current.adminNote,
    payment: nextPayment,
    deliverables: nextDeliverables,
    revisions: nextRevisions,
    updatedAt: now,
  };

  const localIdx = state.orders.findIndex((o) => o.id === orderId);
  if (localIdx >= 0) {
    state.orders[localIdx] = nextOrder;
  }

  const db = await getActiveDb();
  if (db) {
    await db.collection<OrderItem>("orders").updateOne(
      { id: orderId },
      {
        $set: {
          status: nextOrder.status,
          adminNote: nextOrder.adminNote,
          payment: nextOrder.payment,
          deliverables: nextOrder.deliverables,
          revisions: nextOrder.revisions,
          updatedAt: now,
        },
      }
    );
  }

  return nextOrder;
}

export async function submitOrderReview(
  orderId: string,
  userId: string,
  rating: number,
  comment: string
): Promise<OrderItem | null> {
  const state = getState();
  const current = await findOrderById(orderId);
  if (!current || current.userId !== userId) return null;

  const now = new Date().toISOString();
  const review = {
    rating: Math.max(1, Math.min(5, Math.round(rating))),
    comment: comment.trim().slice(0, 800),
    createdAt: now,
  };

  const nextOrder: OrderItem = {
    ...current,
    review,
    updatedAt: now,
  };

  const localIdx = state.orders.findIndex((o) => o.id === orderId);
  if (localIdx >= 0) state.orders[localIdx] = nextOrder;

  const db = await getActiveDb();
  if (db) {
    await db
      .collection<OrderItem>("orders")
      .updateOne({ id: orderId, userId }, { $set: { review, updatedAt: now } });
  }
  return nextOrder;
}

export async function requestOrderRevision(
  orderId: string,
  userId: string,
  note: string
): Promise<OrderItem | null> {
  const state = getState();
  const current = await findOrderById(orderId);
  if (!current || current.userId !== userId) return null;

  const now = new Date().toISOString();
  const rev: OrderRevisionRequest = {
    id: `REV-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
    note: note.trim().slice(0, 1000),
    createdAt: now,
    resolved: false,
  };

  const nextRevisions = [...(current.revisions || []), rev].slice(-10);
  const nextOrder: OrderItem = {
    ...current,
    revisions: nextRevisions,
    status: "Revision Requested",
    updatedAt: now,
  };

  const localIdx = state.orders.findIndex((o) => o.id === orderId);
  if (localIdx >= 0) state.orders[localIdx] = nextOrder;

  const db = await getActiveDb();
  if (db) {
    await db.collection<OrderItem>("orders").updateOne(
      { id: orderId, userId },
      {
        $set: {
          revisions: nextRevisions,
          status: "Revision Requested",
          updatedAt: now,
        },
      }
    );
  }
  return nextOrder;
}

export async function deleteOrderById(orderId: string): Promise<boolean> {
  const state = getState();
  const db = await getActiveDb();
  const prevLen = state.orders.length;
  state.orders = state.orders.filter((o) => o.id !== orderId);
  if (db) {
    const res = await db.collection<OrderItem>("orders").deleteOne({ id: orderId });
    return res.deletedCount > 0;
  }
  return state.orders.length < prevLen;
}
