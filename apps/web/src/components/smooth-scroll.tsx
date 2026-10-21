"use client";

import { useEffect } from "react";

export function SmoothScroll(): null {
  useEffect(() => {
    // Respect prefers-reduced-motion
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href === "#" || href.length <= 1) return;
      const element = document.querySelector(href);
      if (element instanceof HTMLElement) {
        e.preventDefault();
        const top = element.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top, behavior: "smooth" });
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  return null;
}
