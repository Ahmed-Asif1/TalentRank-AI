"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/domain/severity-badge";
import { domain } from "@/lib/domain";

/** Interactive sample of the product's core moment: an analyzed record and a cited answer. */
export function PreviewCard(): React.JSX.Element {
  const p = domain.preview;
  const [asked, setAsked] = useState(false);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-snug">{p.title}</CardTitle>
          <SeverityBadge severity={p.severity} />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground">{domain.labels.scoreLabel}</span>
          <div
            className="h-1.5 w-28 rounded-full bg-muted"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={p.score}
            aria-label={domain.labels.scoreLabel}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${p.score}%` }} />
          </div>
          <span className="text-xs font-medium">{p.score}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-foreground/90">{p.summary}</p>
        <div className="flex flex-wrap gap-1.5">
          {p.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              #{tag}
            </Badge>
          ))}
        </div>
        <div className="space-y-2 border-t border-border pt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => setAsked((v) => !v)} aria-expanded={asked}>
            {asked ? "Hide answer" : `Ask: ${p.question}`}
          </Button>
          <div aria-live="polite">
            {asked && (
              <p className="text-sm leading-relaxed">
                {p.answer}{" "}
                <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                  {p.cite}
                </span>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
