import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { AmbientSpotlight } from "@/components/ambient-spotlight";

export const metadata: Metadata = {
  title: "TalentRank AI — Candidate Intelligence & Leaderboard",
  description: "AI-powered technical recruitment and candidate evaluation engine powered by MongoDB Atlas and Google Gemini.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== "undefined" && window.location.hostname.includes("-temp-9280.vercel.app")) {
                window.location.replace("https://talentrank-ai-chi.vercel.app" + window.location.pathname + window.location.search);
              }
            `,
          }}
        />
      </head>
      <body className="relative min-h-screen bg-background text-foreground antialiased selection:bg-sage/20 selection:text-zinc-100">
        <AmbientSpotlight />
        <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}
