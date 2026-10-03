import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function humanize(key: string): string {
  const spaced = key.replace(/([A-Z])/g, " $1").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">Not found</span>;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">None</span>;
    if (value.every((v) => typeof v !== "object" || v === null)) return value.map(String).join(", ");
    return (
      <ul className="mt-1 space-y-2">
        {value.map((entry, i) => (
          <li key={i} className="rounded-md border border-border bg-muted/20 p-2 text-xs">
            {typeof entry === "object" && entry !== null
              ? Object.entries(entry as Record<string, unknown>).map(([k, v]) => (
                  <div key={k}>
                    <span className="font-medium">{humanize(k)}:</span> {v === "" || v == null ? "—" : String(v)}
                  </div>
                ))
              : String(entry)}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") return <code className="text-xs">{JSON.stringify(value)}</code>;
  return String(value);
}

/** Renders any domain's extracted `fields` as labelled rows, so no per-domain UI is needed. */
export function FieldsPanel({
  fields,
  title = "Extracted details",
}: {
  fields?: Record<string, unknown> | null;
  title?: string;
}): React.JSX.Element | null {
  const entries = Object.entries(fields ?? {});
  if (entries.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3 text-sm">
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs font-medium text-muted-foreground">{humanize(key)}</dt>
              <dd className="mt-0.5 text-foreground/90">{renderValue(value)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
