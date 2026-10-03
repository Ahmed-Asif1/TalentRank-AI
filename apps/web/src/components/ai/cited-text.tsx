import React from "react";
import Link from "next/link";

const CITATION = /\[\[item:([^|\]]+)\|([^\]]+)\]\]/g;

/**
 * Renders assistant text with [[item:<id>|<title>]] markers as clickable source chips.
 * An unfinished marker at the end of a streaming message is hidden until it completes.
 */
export function CitedText({ text }: { text: string }): React.JSX.Element {
  const visible = text.replace(/\[\[[^\]]*$/, "");
  const re = new RegExp(CITATION.source, "g");
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(visible)) !== null) {
    const id = match[1];
    const title = match[2];
    if (!id || !title) continue;
    if (match.index > last) nodes.push(visible.slice(last, match.index));
    nodes.push(
      <Link
        key={`${id}-${match.index}`}
        href={`/items/${id}`}
        className="mx-0.5 inline-flex max-w-[16rem] items-center truncate rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 align-baseline text-[11px] font-medium text-primary hover:bg-primary/20"
        title={`Open source: ${title}`}
      >
        {title}
      </Link>
    );
    last = match.index + match[0].length;
  }
  if (last < visible.length) nodes.push(visible.slice(last));
  return <>{nodes}</>;
}
