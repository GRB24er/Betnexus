import { z } from "zod";

/**
 * Server-side environment variable validation.
 *
 * Call assertServerEnv() from any route or library that needs the variables —
 * it caches the parsed result so validation runs once per process. Failing
 * fast at first request beats discovering misconfiguration in production logs.
 */

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Required at runtime for any DB-touching route.
  MONGODB_URI: z.string().url(),

  // Required everywhere we sign or verify a session.
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters of entropy"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Required to bootstrap or rotate admin accounts.
  ADMIN_SETUP_SECRET: z
    .string()
    .min(32, "ADMIN_SETUP_SECRET must be at least 32 characters")
    .optional(),

  // Payments — optional in dev, required in production.
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),

  // Email — optional. App degrades to logging.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.enum(["true", "false"]).optional(),
  EMAIL_FROM: z.string().optional(),

  // Caches / rate limits — optional.
  REDIS_URL: z.string().optional(),

  // External APIs — optional.
  ODDS_API_KEY: z.string().optional(),
  API_FOOTBALL_KEY: z.string().optional(),

  // App.
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  BTC_DEPOSIT_ADDRESS: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;
let cachedError: Error | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  if (cachedError) throw cachedError;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    cachedError = new Error(
      `Invalid environment configuration:\n${issues}\n\nSee .env.example for required variables.`
    );
    throw cachedError;
  }

  // Production-only requirements: surface them as a clear error rather than
  // letting Paystack fail at first webhook.
  if (parsed.data.NODE_ENV === "production") {
    const required: (keyof ServerEnv)[] = [
      "PAYSTACK_SECRET_KEY",
      "ADMIN_SETUP_SECRET",
      "NEXT_PUBLIC_APP_URL",
    ];
    const missing = required.filter((k) => !parsed.data[k]);
    if (missing.length) {
      cachedError = new Error(
        `Missing required production env vars: ${missing.join(", ")}`
      );
      throw cachedError;
    }
  }

  cached = parsed.data;
  return cached;
}

/** Throws if env is invalid. Use in server routes that must hard-fail. */
export function assertServerEnv(): ServerEnv {
  return getServerEnv();
}
