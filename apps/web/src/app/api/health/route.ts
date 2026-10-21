import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

function sanitizeMongoUri(uriString: string): string {
  try {
    const url = new URL(uriString.replace(/^mongodb\+srv:\/\//, "https://").replace(/^mongodb:\/\//, "http://"));
    if (url.password) {
      url.password = "****";
    }
    const protocol = uriString.startsWith("mongodb+srv") ? "mongodb+srv://" : "mongodb://";
    return `${protocol}${url.host}${url.pathname}`;
  } catch {
    return uriString.includes("@") ? uriString.replace(/:\/\/[^:]+:[^@]+@/, "://***:***@") : uriString;
  }
}

export async function GET(): Promise<Response> {
  const startedAt = Date.now();
  let dbStatus = "unknown";
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const { db } = await connectToDatabase();
    const pingStart = Date.now();
    await db.command({ ping: 1 });
    dbLatencyMs = Date.now() - pingStart;
    dbStatus = "connected";
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }

  const isAtlas = env.MONGODB_URI.startsWith("mongodb+srv://");
  const isLocal = env.MONGODB_URI.includes("localhost") || env.MONGODB_URI.includes("127.0.0.1");

  const systemReport = {
    status: dbStatus === "connected" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      targetType: isAtlas ? "MongoDB Atlas (Cloud)" : isLocal ? "Localhost (Unreachable on Vercel)" : "Custom Host",
      sanitizedUri: sanitizeMongoUri(env.MONGODB_URI),
      dbName: env.MONGODB_DB,
      error: dbError,
    },
    auth: {
      resolvedBaseUrl: env.BETTER_AUTH_URL,
      secretConfigured: Boolean(env.BETTER_AUTH_SECRET && env.BETTER_AUTH_SECRET !== "temporary-stub-secret-32-characters-minimum"),
      apiKeyConfigured: Boolean(env.BETTER_AUTH_API_KEY),
      demoUserEmail: env.DEMO_USER_EMAIL,
    },
    services: {
      geminiConfigured: Boolean(env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY_B),
      apifyConfigured: Boolean(env.APIFY_API_TOKEN),
      upstashRedisConfigured: Boolean(env.UPSTASH_REDIS_REST_URL),
    },
    environment: {
      nodeEnv: env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
      vercelEnv: process.env.VERCEL_ENV || "unknown",
      vercelUrl: process.env.VERCEL_URL || null,
      vercelProjectProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL || null,
    },
    diagnosis:
      dbStatus === "connected"
        ? "All critical subsystems operational."
        : isLocal
          ? "CRITICAL: MONGODB_URI is pointing to localhost, which is unreachable from Vercel serverless functions. Add your MongoDB Atlas connection string to Vercel Environment Variables."
          : "CRITICAL: Cannot connect to MongoDB Atlas. Ensure that '0.0.0.0/0' is added to your MongoDB Atlas Network Access IP Access List, and that your database username and password in MONGODB_URI are correct.",
  };

  return NextResponse.json(systemReport, {
    status: dbStatus === "connected" ? 200 : 503,
  });
}
