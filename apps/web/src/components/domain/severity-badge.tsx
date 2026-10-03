import React from "react";
import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/lib/contracts";

const STYLES: Record<Severity, string> = {
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  critical: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
};

/** The label text always carries the level, so colour is never the only signal. */
export function SeverityBadge({ severity }: { severity?: Severity | null }): React.JSX.Element {
  if (!severity) return <span className="text-xs text-muted-foreground">Not rated</span>;
  return (
    <Badge variant="outline" className={`px-1.5 py-0 text-[10px] capitalize ${STYLES[severity]}`}>
      {severity}
    </Badge>
  );
}
