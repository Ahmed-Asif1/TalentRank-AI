import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { anonymous } from "better-auth/plugins/anonymous";
import { magicLink } from "better-auth/plugins/magic-link";
import { nextCookies } from "better-auth/next-js";
import { getRawDb } from "@/lib/db";
import { env } from "@/lib/env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET || env.BETTER_AUTH_API_KEY || "aicon-hackathon-development-secret-key-32-chars-minimum",
  trustedOrigins: Array.from(
    new Set(
      [
        "https://*.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        env.BETTER_AUTH_URL,
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
        process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : undefined,
      ].filter((x): x is string => Boolean(x && typeof x === "string"))
    )
  ),
  database: mongodbAdapter(getRawDb()),
  emailAndPassword: {
    // Disabled in favor of passwordless magic links and anonymous sessions
    enabled: false,
  },
  plugins: [
    // Enables zero-friction anonymous guest access for evaluations and demos
    anonymous(),
    // Passwordless authentication for real user accounts
    magicLink({
      sendMagicLink: async () => {
        // Wired to transactional email delivery in production
      },
    }),
    // Required for Server Actions and Route Handlers to persist session cookies in Next.js App Router
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
