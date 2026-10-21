import React from "react";
import type { LucideIcon } from "lucide-react";
import { clampScore, getScoreStyle, getStatusStyle } from "@/lib/candidate-ui";

/**
 * Presentational primitives for the studio look.
 * No hooks and no client-only APIs, so they work in server components.
 * Colors come from the sage / ochre / terracotta tokens in globals.css.
 */

export function Panel({
  title,
  icon: Icon,
  aside,
  children,
  className = "",
  bodyClassName = "p-6",
}: {
  title: string;
  icon?: LucideIcon;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}): React.JSX.Element {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-white/[0.07] bg-card ${className}`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.04] px-6 py-4">
        <h2 className="flex items-center gap-2.5 text-sm font-medium text-zinc-100">
          {Icon && <Icon className="size-4 text-zinc-500" aria-hidden="true" />}
          {title}
        </h2>
        {aside && <div className="text-xs text-zinc-500 tabular-nums">{aside}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Circular 0-100 gauge. The arc takes a muted score color; no glow. */
export function ScoreRing({
  score,
  size = 120,
  stroke = 6,
  className = "",
}: {
  score?: number | null;
  size?: number;
  stroke?: number;
  className?: string;
}): React.JSX.Element {
  const has = typeof score === "number" && Number.isFinite(score);
  const value = clampScore(score);
  const style = getScoreStyle(score);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      role="img"
      aria-label={has ? `Match score ${Math.round(value)} out of 100` : "Not scored"}
      className={`relative inline-flex shrink-0 items-center justify-center ${style.text} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-white/[0.08]"
        />
        {has && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - value / 100)}
          />
        )}
      </svg>
      <span
        className="absolute font-mono font-medium text-zinc-100 tabular-nums"
        style={{ fontSize: Math.round(size * 0.28) }}
      >
        {has ? Math.round(value) : "--"}
      </span>
    </div>
  );
}

/** Flat segmented bar. Decorative: always pair it with a numeric readout. */
export function ScoreBar({
  score,
  segments = 10,
  className = "",
}: {
  score?: number | null;
  segments?: number;
  className?: string;
}): React.JSX.Element {
  const has = typeof score === "number" && Number.isFinite(score);
  const value = clampScore(score);
  const filled = has && value > 0 ? Math.max(1, Math.round((value / 100) * segments)) : 0;
  const style = getScoreStyle(score);

  return (
    <div className={`flex h-1 gap-px ${className}`} aria-hidden="true">
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={`flex-1 ${i < filled ? style.bar : "bg-white/[0.08]"}`} />
      ))}
    </div>
  );
}

/**
 * Labeled horizontal meter for the competency breakdown.
 * Always sage: a competency rating is evidence, not a verdict, so it doesn't change color by band.
 */
export function MeterBar({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}): React.JSX.Element {
  const v = clampScore(value);
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-zinc-300">{label}</span>
        <span className="font-mono text-xs text-zinc-400 tabular-nums">{Math.round(v)}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v)}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
      >
        <div className="h-full rounded-full bg-sage/80" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function StatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}): React.JSX.Element {
  const style = getStatusStyle(status);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${style.text} ${className}`}>
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
}

/** Strong Fit / Potential / Unqualified: neutral chip with a single colored dot. */
export function FitBadge({
  score,
  className = "",
}: {
  score?: number | null;
  className?: string;
}): React.JSX.Element {
  const style = getScoreStyle(score);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium whitespace-nowrap ${style.badge} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
}

export function Tag({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}): React.JSX.Element {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`inline-flex cursor-pointer items-center rounded-md border border-white/[0.07] badge-gradient-neutral px-2 py-0.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-white/15 hover:text-white ${className}`}
      >
        {children}
      </button>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-md border border-white/[0.07] badge-gradient-neutral px-2 py-0.5 text-[11px] font-medium text-zinc-300 ${className}`}
    >
      {children}
    </span>
  );
}
