"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  Layers,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { SmoothScroll } from "@/components/smooth-scroll";

/* ================================================================== */
/* Team Data                                                          */
/* ================================================================== */

interface TeamMember {
  id: string;
  name: string;
  role: string;
  focus: string;
  description: string;
  type: "linkedin" | "github";
  profileUrl: string;
  faceCoords?: { top: string; left: string };
  initials: string;
  badge: string;
  side: "left" | "right" | "bottom";
  cardOffsetClass: string;
}

const GITLAB_BRANCH_URL = "https://gitlab.com/ahmed-group802741/talentrank-ai/-/tree/ahmed";
const GITHUB_REPO_URL = "https://github.com/Abdullah860259/Tensor_Slow";

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "ahmed",
    name: "Muhammad Ahmed",
    role: "Core Systems & System Architecture",
    focus: "System Architecture & Pipeline Integration",
    description:
      "Architected the end-to-end evaluation pipeline, Turbopack builds, dynamic leaderboard sorting, and zero-latency state synchronization.",
    type: "linkedin",
    profileUrl: "https://www.linkedin.com/in/muhammad-ahmed-asif-5b0842318/",
    faceCoords: { top: "33%", left: "27%" },
    initials: "MA",
    badge: "Core Architecture",
    side: "left",
    cardOffsetClass:
      "lg:-translate-x-3 lg:-translate-y-4 lg:-rotate-1 hover:rotate-0 hover:scale-[1.02] transition-all duration-300",
  },
  {
    id: "abdullah",
    name: "Abdullah Anwar",
    role: "Database, Auth & API Systems",
    focus: "MongoDB Atlas, Better Auth & Apify Sourcing",
    description:
      "Architected MongoDB document schemas, multi-tenant session isolation, production deployment pipelines, and criteria generation endpoints.",
    type: "linkedin",
    profileUrl: "https://www.linkedin.com/in/abdullah-anwar-cs/",
    faceCoords: { top: "64%", left: "20%" },
    initials: "AA",
    badge: "Database & Auth",
    side: "left",
    cardOffsetClass:
      "lg:translate-x-3 lg:translate-y-3 lg:rotate-1 hover:rotate-0 hover:scale-[1.02] transition-all duration-300",
  },
  {
    id: "yahya",
    name: "Muhammad Yahya Shahzad",
    role: "Frontend & UI/UX Engineering",
    focus: "Studio Dark Design System & Micro-Interactions",
    description:
      "Crafted the editorial Studio Dark design system, dark glassmorphism styling, candidate dossier cards, and responsive micro-interactions.",
    type: "linkedin",
    profileUrl: "https://www.linkedin.com/in/myahyashahzad/",
    faceCoords: { top: "43%", left: "75%" },
    initials: "YS",
    badge: "Frontend & UI/UX",
    side: "right",
    cardOffsetClass:
      "lg:-translate-x-3 lg:-translate-y-4 lg:rotate-1 hover:rotate-0 hover:scale-[1.02] transition-all duration-300",
  },
  {
    id: "mahad",
    name: "Mahad Ehtesham Hashmi",
    role: "Scoring Engine & LinkedIn Ingestion",
    focus: "Deterministic Rubrics & Ingest Pipelines",
    description:
      "Engineered automated LinkedIn profile scraping, Apify Actor integration, rubric scoring validations, and resilient candidate ingestion pipelines.",
    type: "linkedin",
    profileUrl: "https://www.linkedin.com/in/mahad-hashmi/",
    faceCoords: { top: "67%", left: "84%" },
    initials: "MH",
    badge: "Scoring Engine",
    side: "right",
    cardOffsetClass:
      "lg:translate-x-3 lg:translate-y-3 lg:-rotate-1 hover:rotate-0 hover:scale-[1.02] transition-all duration-300",
  },
  {
    id: "hassan",
    name: "Muhammad Hassan",
    role: "RAG & Vector Intelligence",
    focus: "MongoDB Atlas Vector Search & RAG Chat",
    description:
      "Engineered the MongoDB Atlas Vector Search retrieval pipeline, Google Gemini 768-D vector embeddings, in-memory cosine fallback math, and candidate dossier AI chat screening.",
    type: "linkedin",
    profileUrl: "https://www.linkedin.com/in/muhammad-hassan-035a78375",
    initials: "MH",
    badge: "Vector Search & RAG",
    side: "bottom",
    cardOffsetClass: "hover:scale-[1.02] transition-all duration-300",
  },
];

/* Social Icons */
function LinkedInIcon({ className = "size-3.5" }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function GitLabIcon({ className = "size-3.5" }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m23.6 9.58-1.04-3.2a1.08 1.08 0 0 0-.41-.54 1.13 1.13 0 0 0-.71-.19 1.16 1.16 0 0 0-.7.25 1.12 1.12 0 0 0-.37.52L18.7 11.6H5.3L3.63 6.42a1.12 1.12 0 0 0-.37-.52 1.16 1.16 0 0 0-.7-.25 1.13 1.13 0 0 0-.71.19 1.08 1.08 0 0 0-.41.54L.4 9.58a1.06 1.06 0 0 0 .38 1.18l10.74 7.8a.79.79 0 0 0 .96 0l10.74-7.8a1.06 1.06 0 0 0 .38-1.18z" />
    </svg>
  );
}

function GitHubIcon({ className = "size-3.5" }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

/* ================================================================== */
/* Page Component                                                     */
/* ================================================================== */

export default function AboutPage(): React.JSX.Element {
  const router = useRouter();
  const [activeMember, setActiveMember] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Dynamic measuring of SVG connection lines
  const diagramContainerRef = useRef<HTMLDivElement | null>(null);
  const faceDotRefs = useRef<Record<string, HTMLElement | null>>({});
  const cardNodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [lineCoords, setLineCoords] = useState<
    Record<string, { x1: number; y1: number; x2: number; y2: number }>
  >({});

  const handleStartAnonymous = async () => {
    try {
      setLoading(true);
      const res = await authClient.signIn.anonymous();
      if (res && "error" in res && res.error) {
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setDemoLoading(true);
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) {
        setDemoLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setDemoLoading(false);
    }
  };

  // Recalculate line coordinates on mount, resize, and state changes
  useEffect(() => {
    const measure = () => {
      const container = diagramContainerRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const updated: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {};

      TEAM_MEMBERS.forEach((m) => {
        if (!m.faceCoords) return;
        const faceEl = faceDotRefs.current[m.id];
        const cardNodeEl = cardNodeRefs.current[m.id];
        if (faceEl && cardNodeEl) {
          const fRect = faceEl.getBoundingClientRect();
          const cnRect = cardNodeEl.getBoundingClientRect();

          updated[m.id] = {
            x1: fRect.left + fRect.width / 2 - cRect.left,
            y1: fRect.top + fRect.height / 2 - cRect.top,
            x2: cnRect.left + cnRect.width / 2 - cRect.left,
            y2: cnRect.top + cnRect.height / 2 - cRect.top,
          };
        }
      });

      setLineCoords(updated);
    };

    measure();
    const timer1 = setTimeout(measure, 150);
    const timer2 = setTimeout(measure, 400);
    const timer3 = setTimeout(measure, 700);
    window.addEventListener("resize", measure);

    let ro: ResizeObserver | null = null;
    if (diagramContainerRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(diagramContainerRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener("resize", measure);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-foreground selection:bg-sage/20 selection:text-zinc-100">
      <SmoothScroll />

      {/* Header */}
      <header className="sticky top-0 z-50 h-16 border-b border-white/[0.07] bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between border-x border-white/[0.04] px-6 sm:px-12">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-md border border-white/[0.1] bg-black p-0.5 shadow-2xs transition-transform group-hover:scale-105">
              <img src="/favicon.png" alt="TalentRank" className="size-5 object-contain" />
            </span>
            <span className="font-sans text-base font-semibold tracking-tight text-zinc-100">
              TalentRank AI
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/#process"
              className="font-sans text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100"
            >
              Process
            </Link>
            <Link
              href="/#features"
              className="font-sans text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100"
            >
              Features
            </Link>
            <Link
              href="/#faqs"
              className="font-sans text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100"
            >
              FAQs
            </Link>
            <Link
              href="/about"
              className="border-b border-zinc-100 pb-0.5 font-sans text-xs font-semibold text-zinc-100"
            >
              About
            </Link>
            <Link
              href="/dashboard"
              className="font-sans text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100"
            >
              Dashboard
            </Link>
          </nav>

          {/* CTA Group */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDemoLogin}
              disabled={demoLoading || loading}
              className="hidden text-xs font-medium text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100 sm:inline-flex"
            >
              {demoLoading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <User className="size-3.5" aria-hidden="true" />
              )}
              <span>Demo Login</span>
            </Button>
            <Button
              size="sm"
              onClick={handleStartAnonymous}
              disabled={loading || demoLoading}
              className="rounded-md bg-zinc-100 px-4 font-sans text-xs font-medium text-zinc-950 transition-opacity hover:opacity-90"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
              <span>Get Started</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ========================================================== */}
        {/* 1. Team Section: Centered Interactive Photo + Connected Cards */}
        {/* ========================================================== */}
        <section className="relative overflow-hidden border-b border-white/[0.07] bg-transparent pt-14 pb-20 sm:pt-20 sm:pb-28">
          {/* Ambient Top Spotlight Gradients */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-20 -top-24 h-[850px] -z-10 overflow-hidden select-none"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_1200px_700px_at_50%_0%,rgba(85,125,185,0.22),rgba(40,65,105,0.08)_50%,transparent_80%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_850px_500px_at_85%_5%,rgba(105,155,130,0.14),transparent_65%)]" />
            <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/[0.035] via-transparent to-transparent" />
          </div>

          <div className="mx-auto max-w-7xl border-x border-white/[0.04] px-4 sm:px-8 lg:px-12">
            {/* Section Header */}
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-card px-3.5 py-1 text-[11px] font-medium uppercase tracking-wider text-sage">
                <Users className="size-3.5 text-sage" />
                Team TensorSlow
              </span>
              <h1 className="mt-4 font-serif text-3xl font-normal tracking-tight text-zinc-50 sm:text-5xl md:text-6xl">
                The Engineers Behind TalentRank
              </h1>
              <p className="mt-4 font-sans text-sm leading-relaxed text-pretty text-zinc-400 sm:text-base md:text-lg">
                Built for the <strong>AICON Hackathon 2026</strong>. Five engineers collaborating to
                bring mathematical determinism, sub-second vector search, and autonomous LinkedIn
                talent sourcing to technical recruitment.
              </p>
            </div>

            {/* Diagram Container: External Cards on Left/Right + Unobstructed Image in Center */}
            <div
              ref={diagramContainerRef}
              className="relative mx-auto mt-12 w-full max-w-7xl sm:mt-16"
            >
              {/* Dynamic SVG Connecting Lines Layer (Desktop only) */}
              <svg
                className="pointer-events-none absolute inset-0 z-30 hidden h-full w-full lg:block"
                aria-hidden="true"
              >
                {TEAM_MEMBERS.filter((m) => m.faceCoords).map((m) => {
                  const pts = lineCoords[m.id];
                  if (!pts) return null;

                  const isActive = activeMember === m.id;
                  const midX = (pts.x1 + pts.x2) / 2;
                  const path = `M ${pts.x1} ${pts.y1} C ${midX} ${pts.y1}, ${midX} ${pts.y2}, ${pts.x2} ${pts.y2}`;

                  return (
                    <g key={`svg-line-${m.id}`}>
                      {/* Main connecting stroke */}
                      <path
                        d={path}
                        fill="none"
                        stroke="currentColor"
                        className={
                          isActive
                            ? "text-sage transition-colors duration-300"
                            : "text-white/20 transition-colors duration-300"
                        }
                        strokeWidth={isActive ? "2" : "1.5"}
                        strokeDasharray={isActive ? "none" : "3 3"}
                        strokeOpacity={isActive ? 1 : 0.65}
                        strokeLinecap="round"
                      />
                      {/* Card endpoint anchor dot */}
                      <circle
                        cx={pts.x2}
                        cy={pts.y2}
                        r={isActive ? "3.5" : "2.5"}
                        className={
                          isActive
                            ? "fill-sage transition-all duration-300"
                            : "fill-zinc-400 transition-all duration-300"
                        }
                      />
                    </g>
                  );
                })}
              </svg>

              {/* 3-Column Layout: Left Cards | Center Photo | Right Cards */}
              <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-[250px_minmax(0,1fr)_250px] xl:grid-cols-[280px_minmax(0,1fr)_280px] lg:gap-8">
                {/* ── Left Column: Ahmed & Abdullah ── */}
                <div className="z-30 hidden h-full flex-col justify-around gap-6 py-2 lg:flex">
                  {TEAM_MEMBERS.filter((m) => m.side === "left").map((member) => {
                    const isActive = activeMember === member.id;
                    return (
                      <div
                        key={member.id}
                        onMouseEnter={() => setActiveMember(member.id)}
                        onMouseLeave={() => setActiveMember(null)}
                        className={`group relative rounded-xl border p-4 shadow-2xs transition-all duration-300 hover:shadow-md ${
                          isActive
                            ? "border-sage/40 bg-card ring-1 ring-sage/20"
                            : "border-white/[0.07] bg-card hover:border-white/[0.15]"
                        } ${member.cardOffsetClass}`}
                      >
                        {/* Anchor Node facing center image */}
                        <div
                          ref={(el) => {
                            cardNodeRefs.current[member.id] = el;
                          }}
                          className={`absolute -right-1.5 top-1/2 flex size-3 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background transition-colors ${
                            isActive ? "bg-sage ring-2 ring-sage/30" : "bg-zinc-500"
                          }`}
                        />

                        <div className="flex items-center justify-between gap-2">
                          <span className="flex size-7 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.03] font-mono text-[11px] font-semibold text-zinc-100">
                            {member.initials}
                          </span>
                          <span className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2 py-0.5 font-sans text-[10px] font-medium tracking-wide text-zinc-400 uppercase">
                            {member.badge}
                          </span>
                        </div>

                        <h3 className="mt-2.5 font-serif text-base font-normal tracking-tight text-zinc-100">
                          {member.name}
                        </h3>
                        <p className="font-sans text-[11px] font-medium text-sage">{member.role}</p>
                        <p className="mt-1.5 font-sans text-xs leading-relaxed text-zinc-400">
                          {member.description}
                        </p>

                        <div className="mt-3.5 border-t border-white/[0.04] pt-2.5">
                          <a
                            href={member.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.02] py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                          >
                            <LinkedInIcon className="size-3 text-[#0A66C2]" />
                            <span>LinkedIn Profile</span>
                            <ExternalLink className="size-2.5 opacity-60" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Center Column: Unobstructed Team Photograph ── */}
                <div className="relative z-10 mx-auto w-full">
                  <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card p-2.5 shadow-xl sm:p-3">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black/40 sm:aspect-[16/11]">
                      {/* Crystal clear photograph */}
                      <img
                        src="/team.jpg"
                        alt="Team TensorSlow at AICON Hackathon: Muhammad Ahmed, Abdullah Anwar, Muhammad Yahya, and Mahad Hashmi"
                        className="h-full w-full object-cover object-center filter contrast-[1.04]"
                      />

                      {/* Subtle dark vignette at bottom */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                      {/* Face Marker Pins */}
                      {TEAM_MEMBERS.filter((m) => m.faceCoords).map((member) => {
                        const isActive = activeMember === member.id;
                        return (
                          <div
                            key={`face-dot-${member.id}`}
                            ref={(el) => {
                              faceDotRefs.current[member.id] = el;
                            }}
                            style={{
                              top: member.faceCoords?.top,
                              left: member.faceCoords?.left,
                            }}
                            onMouseEnter={() => setActiveMember(member.id)}
                            onMouseLeave={() => setActiveMember(null)}
                            className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30"
                            aria-label={member.name}
                          >
                            {/* Pin Dot */}
                            <span
                              className={`relative flex size-3 items-center justify-center rounded-full border border-white shadow-xs transition-transform duration-200 ${
                                isActive ? "scale-125 bg-sage ring-4 ring-sage/40" : "bg-steel"
                              }`}
                            />
                            {/* Hover tooltip */}
                            <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-0.5 font-sans text-[10px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                              {member.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <p className="mt-3 text-center font-sans text-xs text-zinc-500 lg:hidden">
                    Team TensorSlow at AICON Hackathon 2026
                  </p>
                </div>

                {/* ── Right Column: Yahya & Mahad ── */}
                <div className="z-30 hidden h-full flex-col justify-around gap-6 py-2 lg:flex">
                  {TEAM_MEMBERS.filter((m) => m.side === "right").map((member) => {
                    const isActive = activeMember === member.id;
                    return (
                      <div
                        key={member.id}
                        onMouseEnter={() => setActiveMember(member.id)}
                        onMouseLeave={() => setActiveMember(null)}
                        className={`group relative rounded-xl border p-4 shadow-2xs transition-all duration-300 hover:shadow-md ${
                          isActive
                            ? "border-sage/40 bg-card ring-1 ring-sage/20"
                            : "border-white/[0.07] bg-card hover:border-white/[0.15]"
                        } ${member.cardOffsetClass}`}
                      >
                        {/* Anchor Node facing center image */}
                        <div
                          ref={(el) => {
                            cardNodeRefs.current[member.id] = el;
                          }}
                          className={`absolute -left-1.5 top-1/2 flex size-3 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background transition-colors ${
                            isActive ? "bg-sage ring-2 ring-sage/30" : "bg-zinc-500"
                          }`}
                        />

                        <div className="flex items-center justify-between gap-2">
                          <span className="flex size-7 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.03] font-mono text-[11px] font-semibold text-zinc-100">
                            {member.initials}
                          </span>
                          <span className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2 py-0.5 font-sans text-[10px] font-medium tracking-wide text-zinc-400 uppercase">
                            {member.badge}
                          </span>
                        </div>

                        <h3 className="mt-2.5 font-serif text-base font-normal tracking-tight text-zinc-100">
                          {member.name}
                        </h3>
                        <p className="font-sans text-[11px] font-medium text-sage">{member.role}</p>
                        <p className="mt-1.5 font-sans text-xs leading-relaxed text-zinc-400">
                          {member.description}
                        </p>

                        <div className="mt-3.5 border-t border-white/[0.04] pt-2.5">
                          <a
                            href={member.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.02] py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                          >
                            {member.type === "linkedin" ? (
                              <>
                                <LinkedInIcon className="size-3 text-[#0A66C2]" />
                                <span>LinkedIn Profile</span>
                              </>
                            ) : (
                              <>
                                <GitHubIcon className="size-3 text-zinc-200" />
                                <span>GitHub Profile</span>
                              </>
                            )}
                            <ExternalLink className="size-2.5 opacity-60" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Team Member Cards (Stacked below image on small viewports) */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
                {TEAM_MEMBERS.map((member) => (
                  <div
                    key={`mobile-grid-${member.id}`}
                    className="rounded-xl border border-white/[0.07] bg-card p-4 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-7 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.03] font-mono text-[11px] font-semibold text-zinc-100">
                        {member.initials}
                      </span>
                      <span className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2 py-0.5 font-sans text-[10px] font-medium text-zinc-400 uppercase">
                        {member.badge}
                      </span>
                    </div>

                    <h3 className="mt-2.5 font-serif text-base font-normal tracking-tight text-zinc-100">
                      {member.name}
                    </h3>
                    <p className="font-sans text-[11px] font-medium text-sage">{member.role}</p>
                    <p className="mt-1 font-sans text-xs leading-relaxed text-zinc-400">
                      {member.description}
                    </p>

                    <div className="mt-3.5 border-t border-white/[0.04] pt-2.5">
                      <a
                        href={member.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.02] py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        {member.type === "linkedin" ? (
                          <>
                            <LinkedInIcon className="size-3 text-[#0A66C2]" />
                            <span>LinkedIn Profile</span>
                          </>
                        ) : (
                          <>
                            <GitHubIcon className="size-3 text-zinc-200" />
                            <span>GitHub Profile</span>
                          </>
                        )}
                        <ExternalLink className="size-2.5 opacity-60" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5th Member Card on Desktop (Muhammad Hassan) */}
            <div className="mx-auto mt-8 hidden max-w-xl lg:block">
              {TEAM_MEMBERS.filter((m) => m.side === "bottom").map((member) => (
                <div
                  key={member.id}
                  className="rounded-xl border border-white/[0.07] bg-card p-4 shadow-2xs transition-all duration-300 hover:border-white/[0.15]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.03] font-mono text-[11px] font-semibold text-zinc-100">
                        {member.initials}
                      </span>
                      <div>
                        <h3 className="font-serif text-base font-normal tracking-tight text-zinc-100">
                          {member.name}
                        </h3>
                        <p className="font-sans text-[11px] font-medium text-sage">{member.role}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-0.5 font-sans text-[10px] font-medium text-zinc-400 uppercase">
                      {member.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">{member.description}</p>
                  <div className="mt-3.5 border-t border-white/[0.04] pt-2.5">
                    <a
                      href={member.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.02] py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <LinkedInIcon className="size-3 text-[#0A66C2]" />
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="size-2.5 opacity-60" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* 2. Product Section: Mission & Technical Pillars            */}
        {/* ========================================================== */}
        <section className="border-b border-white/[0.07] bg-card/20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl border-x border-white/[0.04] px-6 sm:px-12">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-card px-3.5 py-1 text-[11px] font-medium uppercase tracking-wider text-sage">
                <Sparkles className="size-3.5 text-sage" />
                Product Architecture
              </span>
              <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-zinc-50 sm:text-4xl md:text-5xl">
                Engineered for Objective Truth in Technical Hiring
              </h2>
              <p className="mt-4 font-sans text-base leading-relaxed text-pretty text-zinc-400">
                Traditional ATS platforms rely on brittle keyword string matching, while ungrounded
                LLM screening invents hallucinations. TalentRank delivers deterministic, repeatable
                candidate intelligence.
              </p>
            </div>

            {/* Architecture Grid */}
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-white/[0.07] bg-card p-6 shadow-xs">
                <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-sage">
                  <Cpu className="size-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-normal text-zinc-100">
                  Deterministic Rubric Evaluation
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Plain-English job criteria expand into strict mathematical rubrics: Must-Haves,
                  Nice-to-Haves, and Red Flags. Scored from 0 to 100 with zero model drift.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-card p-6 shadow-xs">
                <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-steel">
                  <Database className="size-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-normal text-zinc-100">
                  MongoDB Atlas Vector Search
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Every resume is indexed into 768-dimensional Gemini vector embeddings in MongoDB
                  Atlas in under 450ms, enabling instant semantic similarity and hybrid retrieval.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-card p-6 shadow-xs">
                <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-sage">
                  <Search className="size-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-normal text-zinc-100">
                  Apify Autonomous Sourcing
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Recruiters trigger autonomous LinkedIn scraping runs with customized filters.
                  Profiles are imported, deduplicated, and scored automatically into live
                  leaderboards.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-card p-6 shadow-xs">
                <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-sage">
                  <CheckCircle2 className="size-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-normal text-zinc-100">
                  Verifiable Source Citations
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Every competency credit anchors to an exact, quoted text span in the candidate&apos;s
                  resume or public work. Zero phantom credentials or fabricated claims.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-card p-6 shadow-xs">
                <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-ochre">
                  <ShieldCheck className="size-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-normal text-zinc-100">
                  Blind Anti-Bias Screening
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Removes candidate identity markers, demographic details, photos, and university
                  prestige bias so engineers are benchmarked exclusively on verified technical
                  competency.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-card p-6 shadow-xs">
                <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-terracotta">
                  <ShieldAlert className="size-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-normal text-zinc-100">
                  Tenure Anomaly Detection
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Algorithms analyze career timeline discontinuities, overlapping tenures, and
                  inflated seniority jumps, flagging risks for recruiters before interview
                  scheduling.
                </p>
              </div>
            </div>

            {/* Hackathon Showcase Box */}
            <div className="mt-14 rounded-2xl border border-white/[0.08] bg-card p-8 shadow-sm sm:p-12">
              <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <span className="font-mono text-xs font-semibold tracking-widest text-sage uppercase">
                    AICON Hackathon 2026
                  </span>
                  <h3 className="mt-1 font-serif text-2xl font-normal tracking-tight text-zinc-100 sm:text-3xl">
                    Built by Team TensorSlow
                  </h3>
                  <p className="mt-2 max-w-2xl text-xs leading-relaxed text-zinc-400">
                    Developed collaboratively under tight hackathon deadlines to pioneer a new
                    standard for AI-native talent evaluation. Open-source and deployed for
                    demonstration.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <a
                    href={GITLAB_BRANCH_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-2 font-sans text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    <GitLabIcon className="size-3.5 text-[#FC6D26]" />
                    <span>GitLab (Branch: ahmed)</span>
                    <ExternalLink className="size-2.5 opacity-60" />
                  </a>
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-2 font-sans text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    <GitHubIcon className="size-3.5 text-zinc-100" />
                    <span>GitHub (Tensor_Slow)</span>
                    <ExternalLink className="size-2.5 opacity-60" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* 3. Call to Action                                         */}
        {/* ========================================================== */}
        <section className="bg-transparent py-20 sm:py-28">
          <div className="mx-auto max-w-7xl border-x border-white/[0.04] px-6 sm:px-12">
            <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-b from-white/[0.05] via-card to-card p-10 text-center shadow-raised sm:p-16">
              <h2 className="mx-auto max-w-2xl font-serif text-3xl font-normal tracking-tight text-zinc-50 sm:text-4xl md:text-5xl">
                Experience TalentRank In Action
              </h2>
              <p className="mx-auto mt-4 max-w-xl font-sans text-sm leading-relaxed text-zinc-400 sm:text-base">
                Test our deterministic scoring rubrics, upload your own resumes, or inspect
                real-time candidate dossiers in a live demo.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <Button
                  size="lg"
                  onClick={handleStartAnonymous}
                  disabled={loading || demoLoading}
                  className="h-11 rounded-md bg-zinc-100 px-6 font-sans text-xs font-medium text-zinc-950 transition-opacity hover:opacity-90"
                >
                  {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
                  <span>Launch Live Demo →</span>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDemoLogin}
                  disabled={loading || demoLoading}
                  className="h-11 rounded-md border border-white/[0.07] bg-card px-6 font-sans text-xs font-medium text-zinc-200 hover:bg-white/[0.05] hover:text-white"
                >
                  {demoLoading ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <User className="mr-1 size-3.5 text-zinc-400" aria-hidden="true" />
                  )}
                  <span>Explore as Demo User</span>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] bg-card text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl border-x border-white/[0.04] px-6 py-14 sm:px-12">
          <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-md border border-white/[0.1] bg-black p-0.5">
                  <img src="/favicon.png" alt="TalentRank" className="size-5 object-contain" />
                </span>
                <span className="font-sans text-base font-semibold tracking-tight text-zinc-100">
                  TalentRank AI
                </span>
              </div>
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-zinc-400">
                Autonomous multi-agent candidate intelligence engineered for high-signal technical
                recruitment.
              </p>
              <p className="mt-6 font-mono text-[11px] text-zinc-500">
                © {new Date().getFullYear()} TalentRank AI · Team TensorSlow. All rights reserved.
              </p>
            </div>
            <div>
              <h4 className="font-sans text-xs font-medium uppercase tracking-wider text-zinc-200">
                Product
              </h4>
              <ul className="mt-4 space-y-2.5 text-xs">
                <li>
                  <Link href="/#process" className="text-zinc-400 transition-colors hover:text-zinc-100">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/#features" className="text-zinc-400 transition-colors hover:text-zinc-100">
                    Core Capabilities
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="font-medium text-zinc-100">
                    About Our Team
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-sans text-xs font-medium uppercase tracking-wider text-zinc-200">
                Stack
              </h4>
              <ul className="mt-4 space-y-2.5 text-xs text-zinc-400">
                <li>Next.js 16.4 / React 19</li>
                <li>MongoDB Atlas (768-D Vector Search)</li>
                <li>Google Gemini 3.6 Flash</li>
                <li>Better Auth & Apify Actors</li>
              </ul>
            </div>
            <div>
              <h4 className="font-sans text-xs font-medium uppercase tracking-wider text-zinc-200">
                Resources
              </h4>
              <ul className="mt-4 space-y-2.5 text-xs">
                <li>
                  <Link href="/#faqs" className="text-zinc-400 transition-colors hover:text-zinc-100">
                    System FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-zinc-400 transition-colors hover:text-zinc-100">
                    Live Leaderboard
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-sage"></span>
              </span>
              <span className="font-sans text-xs font-medium text-zinc-300">
                All systems operational
              </span>
            </div>
            <p className="font-sans text-xs text-zinc-500">
              Built for the AICON Hackathon 2026 by Team TensorSlow
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
