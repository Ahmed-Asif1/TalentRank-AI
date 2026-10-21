import { z } from "zod";

if (typeof window !== "undefined") {
  throw new Error("apps/web/src/lib/env.ts is server-only and must not be imported on the client.");
}

function isPlaceholder(val?: string | null): boolean {
  if (!val) return true;
  return /your-project|example\.com|placeholder/i.test(val);
}

function normalize(url: string): string {
  const trimmed = url.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

function resolveAuthUrl(): string {
  if (process.env.VERCEL) {
    if (process.env.BETTER_AUTH_URL && !isPlaceholder(process.env.BETTER_AUTH_URL)) {
      return normalize(process.env.BETTER_AUTH_URL);
    }
    if (process.env.NEXT_PUBLIC_APP_URL && !isPlaceholder(process.env.NEXT_PUBLIC_APP_URL)) {
      return normalize(process.env.NEXT_PUBLIC_APP_URL);
    }
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return normalize(process.env.VERCEL_PROJECT_PRODUCTION_URL);
    }
    if (process.env.VERCEL_URL) {
      return normalize(process.env.VERCEL_URL);
    }
  }

  const candidate =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (!candidate || isPlaceholder(candidate)) {
    return "http://localhost:3000";
  }

  return normalize(candidate);
}

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI cannot be empty").default("mongodb://localhost/?directConnection=true"),
  MONGODB_DB: z.string().min(1, "MONGODB_DB cannot be empty").default("aicon"),
  BETTER_AUTH_SECRET: z
    .string()
    .optional()
    .transform((val) => val || process.env.BETTER_AUTH_API_KEY || "aicon-hackathon-development-secret-key-32-chars-minimum"),
  BETTER_AUTH_API_KEY: z.string().optional(),
  BETTER_AUTH_URL: z
    .string()
    .optional()
    .transform((val) => {
      if (val && val.trim().length > 0 && !isPlaceholder(val)) {
        return normalize(val);
      }
      return resolveAuthUrl();
    })
    .pipe(z.string().url("BETTER_AUTH_URL must be a valid URL")),
  AI_GATEWAY_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY_B: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  DEMO_USER_EMAIL: z.string().email().default("demo@example.com"),
  LINKEDIN_SESSION_COOKIE: z.string().optional(),
  CHAT_MODEL_ID: z.string().optional().default("gemini-3.6-flash"),
  APIFY_API_TOKEN: z.string().optional().default(""),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().optional(),
});

const serverResult = serverEnvSchema.safeParse(process.env);

if (!serverResult.success) {
  const formattedErrors = serverResult.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`[Server Environment Validation Failed]:\n${formattedErrors}`);
}

const clientResult = clientEnvSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!clientResult.success) {
  const formattedErrors = clientResult.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`[Client Environment Validation Failed]:\n${formattedErrors}`);
}

export const env = serverResult.data;
export const clientEnv = clientResult.data;
