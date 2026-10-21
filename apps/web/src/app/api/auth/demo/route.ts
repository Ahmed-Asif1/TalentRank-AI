import { makeSignature } from "better-auth/crypto";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const DEMO_EMAIL = env.DEMO_USER_EMAIL || "demo@example.com";

export async function POST(): Promise<Response> {
  try {
    const ctx = await auth.$context;

    // Find the existing seeded demo user or create if missing
    const userResult = await ctx.internalAdapter.findUserByEmail(DEMO_EMAIL);
    let userId: string;

    if (!userResult?.user) {
      const newUser = await ctx.internalAdapter.createUser(
        {
          name: "Demo User",
          email: DEMO_EMAIL,
          emailVerified: true,
        },
        { method: "demo" }
      );
      userId = newUser.id;
    } else {
      userId = userResult.user.id;
    }

    // Create a new Better Auth session for the demo user
    const session = await ctx.internalAdapter.createSession(userId);
    if (!session?.token) {
      return new Response(JSON.stringify({ error: "Failed to create demo session" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sign the session token using Better Auth's HMAC signature
    const signature = await makeSignature(session.token, ctx.secret);
    const signedToken = `${session.token}.${encodeURIComponent(signature)}`;
    const isHttps = env.BETTER_AUTH_URL.startsWith("https://") || env.NODE_ENV === "production";

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const standardCookie = `better-auth.session_token=${signedToken}; Path=/; HttpOnly; SameSite=Lax${isHttps ? "; Secure" : ""}; Max-Age=${30 * 24 * 60 * 60}`;
    headers.append("Set-Cookie", standardCookie);

    if (isHttps) {
      const secureCookie = `__Secure-better-auth.session_token=${signedToken}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${30 * 24 * 60 * 60}`;
      headers.append("Set-Cookie", secureCookie);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers,
    });
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    logger.error("[demo-login] Failed to sign in as demo user", errorObj);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorObj.message,
        name: errorObj.name,
        hint:
          errorObj.name === "MongoServerSelectionError" || errorObj.message.includes("Mongo")
            ? "Database connection failed. Please ensure MONGODB_URI is properly configured in Vercel environment variables and MongoDB Atlas Network Access has 0.0.0.0/0 allowed."
            : "Check /api/health to inspect system diagnostics.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
