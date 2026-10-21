"use client";

import React, { useEffect, useState } from "react";

/**
 * Ambient background enhancement providing:
 * 1. Top-anchored massive diffuse spotlight gradients (soft slate blue & warm charcoal).
 * 2. Tactile CSS noise/grain overlay at 2.5% opacity with overlay mix-blend-mode.
 * 3. Interactive cursor illumination: a low-opacity blurred circle of light that smoothly tracks
 *    the user's cursor behind semi-transparent glassmorphism cards without visual clutter.
 */
export function AmbientSpotlight(): React.JSX.Element {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hasHover, setHasHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canHover = window.matchMedia("(hover: hover)").matches;
    setHasHover(canHover);
    if (!canHover) return;

    let rafId: number;
    let targetX = -1000;
    let targetY = -1000;

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setMousePos({ x: targetX, y: targetY });
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* 1. Primary Top-Centered Diffuse Radial Spotlight */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_1100px_650px_at_50%_-60px,rgba(85,125,185,0.22),rgba(40,65,105,0.08)_50%,transparent_80%)]"
      />

      {/* 2. Secondary Top-Right Subtle Warm Accent Spotlight */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_850px_500px_at_85%_0px,rgba(105,155,130,0.14),transparent_65%)]"
      />

      {/* 3. Subtle Horizon Top Diffuse Glow */}
      <div
        className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-white/[0.035] via-transparent to-transparent pointer-events-none"
      />

      {/* 4. Interactive Cursor Illumination (Desktop only, behind cards) */}
      {hasHover && mousePos && (
        <div
          className="absolute inset-0 transition-opacity duration-500 will-change-transform"
          style={{
            background: `radial-gradient(520px circle at ${mousePos.x}px ${mousePos.y}px, rgba(135, 170, 215, 0.09), transparent 75%)`,
          }}
        />
      )}

      {/* 5. Tactile Matte Noise/Grain Texture */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: "url('/noise.png')",
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
