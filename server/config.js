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

  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(3),
  EMAIL_REPLY_TO: z.string().optional(),

  GOOGLE_OAUTH_CLIENT_ID: z.string().min(1),

  CREEM_API_KEY: z.string().min(1),
  CREEM_API_BASE: z.string().url(),
  CREEM_WEBHOOK_SECRET: z.string().min(1),
  CREEM_SUCCESS_URL: z.string().url(),
  CREEM_CANCEL_URL: z.string().url(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
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
  },

  resend: {
    apiKey: env.RESEND_API_KEY,
    from: env.EMAIL_FROM,
    replyTo: env.EMAIL_REPLY_TO,
  },

  google: {
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
  },

  creem: {
    apiKey: env.CREEM_API_KEY,
    apiBase: env.CREEM_API_BASE.replace(/\/$/, ""),
    webhookSecret: env.CREEM_WEBHOOK_SECRET,
    successUrl: env.CREEM_SUCCESS_URL,
    cancelUrl: env.CREEM_CANCEL_URL,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    authMax: env.AUTH_RATE_LIMIT_MAX,
  },
};
