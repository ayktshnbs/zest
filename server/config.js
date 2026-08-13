// Centralized, validated runtime configuration.
// Reads from process.env once at startup and fails fast on bad config.

import { z } from "zod";

const boolFromString = z
  .union([z.string(), z.boolean()])
  .transform((v) => (typeof v === "boolean" ? v : ["1", "true", "yes", "on"].includes(v.toLowerCase())));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.string().default("info"),

  ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean)),

  COOKIE_DOMAIN: z.string().optional().transform((v) => (v && v.length ? v : undefined)),
  COOKIE_SECURE: boolFromString.default("false"),

  DATABASE_URL: z.string().optional().transform((v) => (v && v.length ? v : undefined)),
  PGHOST: z.string().default("localhost"),
  PGPORT: z.coerce.number().int().positive().default(5432),
  PGUSER: z.string().default("postgres"),
  PGPASSWORD: z.string().default(""),
  PGDATABASE: z.string().default("zest_kitchene"),
  PG_SSL: boolFromString.default("false"),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),

  CSRF_SECRET: z.string().min(32, "CSRF_SECRET must be at least 32 chars"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  PASSWORD_RESET_URL: z.string().url(),
  LOGIN_URL: z.string().url(),
  EMAIL_VERIFICATION_URL: z.string().url().optional(),

  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(3),
  EMAIL_REPLY_TO: z.string().optional(),
  // Inbox for contact-form submissions. Defaults to info@zest-home.net if unset
  // so a fresh deploy "just works"; override in prod env if you change addresses.
  CONTACT_INBOX: z.string().email().default("info@zest-home.net"),

  GOOGLE_OAUTH_CLIENT_ID: z.string().min(1),

  PAYTR_MERCHANT_ID: z.string().min(1),
  PAYTR_MERCHANT_KEY: z.string().min(1),
  PAYTR_MERCHANT_SALT: z.string().min(1),
  PAYTR_SUCCESS_URL: z.string().url(),
  PAYTR_FAIL_URL: z.string().url(),
  PAYTR_TEST_MODE: z.enum(["0", "1"]).default("1"),

  // Cloudinary (image upload). Optional — admin uploads return 503 if unset.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  // Order creation is stricter than general browsing: each POST reserves
  // stock, so an abusive client could hold inventory hostage.
  CHECKOUT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  // Pending-order expiry (jobs/expirePendingOrders.js). TTL = how long a
  // pending order may hold stock; interval = in-process sweep cadence.
  ORDER_EXPIRY_ENABLED: z
    .string()
    .optional()
    .default("true")
    .transform((v) => v !== "false"),
  ORDER_PENDING_TTL_MINUTES: z.coerce.number().int().positive().default(60),
  ORDER_EXPIRY_INTERVAL_MINUTES: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  // eslint-disable-next-line no-console
  console.error(`\nInvalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === "production",
  port: env.PORT,
  logLevel: env.LOG_LEVEL,
  allowedOrigins: env.ALLOWED_ORIGINS,

  cookies: {
    domain: env.COOKIE_DOMAIN,
    secure: env.COOKIE_SECURE || env.NODE_ENV === "production",
  },

  db: {
    connectionString: env.DATABASE_URL,
    host: env.PGHOST,
    port: env.PGPORT,
    user: env.PGUSER,
    password: env.PGPASSWORD,
    database: env.PGDATABASE,
    ssl: env.PG_SSL ? { rejectUnauthorized: false } : false,
  },

  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    enabled:
      Boolean(env.CLOUDINARY_CLOUD_NAME) &&
      Boolean(env.CLOUDINARY_API_KEY) &&
      Boolean(env.CLOUDINARY_API_SECRET),
  },

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshTtl: env.JWT_REFRESH_TTL,
  },

  csrfSecret: env.CSRF_SECRET,
  bcryptRounds: env.BCRYPT_ROUNDS,

  urls: {
    frontend: env.FRONTEND_URL,
    passwordReset: env.PASSWORD_RESET_URL,
    login: env.LOGIN_URL,
    emailVerification:
      env.EMAIL_VERIFICATION_URL ||
      `${env.FRONTEND_URL.replace(/\/$/, "")}/e-posta-dogrula`,
  },

  resend: {
    apiKey: env.RESEND_API_KEY,
    from: env.EMAIL_FROM,
    replyTo: env.EMAIL_REPLY_TO,
  },

  contact: {
    inbox: env.CONTACT_INBOX,
  },

  google: {
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
  },

  paytr: {
    merchantId: env.PAYTR_MERCHANT_ID,
    merchantKey: env.PAYTR_MERCHANT_KEY,
    merchantSalt: env.PAYTR_MERCHANT_SALT,
    successUrl: env.PAYTR_SUCCESS_URL,
    failUrl: env.PAYTR_FAIL_URL,
    testMode: env.PAYTR_TEST_MODE,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    authMax: env.AUTH_RATE_LIMIT_MAX,
    checkoutMax: env.CHECKOUT_RATE_LIMIT_MAX,
  },

  orderExpiry: {
    enabled: env.ORDER_EXPIRY_ENABLED,
    ttlMinutes: env.ORDER_PENDING_TTL_MINUTES,
    intervalMinutes: env.ORDER_EXPIRY_INTERVAL_MINUTES,
  },
};
