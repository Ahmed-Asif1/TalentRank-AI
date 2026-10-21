import React from "react";
import Link from "next/link";

type Citation = { id: string; title: string; n: number };
type CitationIndex = Map<string, Citation>;

const CITATION_SOURCE = "\\[\\[item:([^|\\]]+)\\|([^\\]]+)\\]\\]";

/**
 * Numbers each distinct source in order of first appearance, so [[item:a|A]] ... [[item:b|B]] ... [[item:a|A]]
 * renders as footnotes 1, 2, 1. Text only ever grows while streaming, so numbers never shift under the reader.
 */
function buildCitationIndex(text: string): CitationIndex {
  const index: CitationIndex = new Map();
  const re = new RegExp(CITATION_SOURCE, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const id = match[1];
    const title = match[2];
    if (id && title && !index.has(id)) {
      index.set(id, { id, title: title.trim(), n: index.size + 1 });
    }
  }
  return index;
}

/** Small superscript reference. Hover or focus reveals the source; click opens it. */
function Footnote({ citation }: { citation: Citation }): React.JSX.Element {
  return (
    <span className="group/cite relative mx-0.5 inline-block align-baseline">
      <Link
        href={`/items/${citation.id}`}
        aria-label={`Source ${citation.n}: ${citation.title}`}
        className="relative -top-[3px] inline-flex h-4 min-w-4 items-center justify-center rounded border border-white/10 bg-white/5 px-1 text-[10px] leading-none font-medium text-zinc-400 tabular-nums transition-colors hover:text-zinc-200 focus-visible:text-zinc-200 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      >
        {citation.n}
      </Link>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[18rem] -translate-x-1/2 rounded-lg border border-white/[0.08] bg-popover px-3 py-2 text-left text-xs leading-snug whitespace-normal text-zinc-300 opacity-0 shadow-overlay transition-opacity duration-150 group-focus-within/cite:opacity-100 group-hover/cite:opacity-100 motion-reduce:transition-none"
      >
        <span className="block text-[11px] text-zinc-500">Source {citation.n}</span>
        <span className="block">{citation.title}</span>
      </span>
    </span>
  );
}

/**
 * Parses inline formatted spans: citations [[item:id|title]], bold **bold text**, and inline `code`.
 */
function renderInlineSpans(
  rawText: string,
  keyPrefix: string,
  citations: CitationIndex,
): React.ReactNode[] {
  // Normalize awkward whitespace: before punctuation (" ] ." -> " ].") and before a citation,
  // so the footnote hugs the word it supports.
  const sanitized = rawText
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s+(\[\[item:)/g, "$1");
  const nodes: React.ReactNode[] = [];

  // Match either citation [[item:...|...]] or bold **...** or code `...`
  const tokenRegex = /(\[\[item:[^|\]]+\|[^\]]+\]\]|\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(sanitized)) !== null) {
    const matchIndex = match.index;
    const matchStr = match[0];

    // Push leading plain text
    if (matchIndex > lastIndex) {
      nodes.push(sanitized.slice(lastIndex, matchIndex));
    }

    if (matchStr.startsWith("[[item:")) {
      const citeMatch = /\[\[item:([^|\]]+)\|([^\]]+)\]\]/.exec(matchStr);
      const id = citeMatch?.[1];
      const citation = id ? citations.get(id) : undefined;
      if (citation) {
        nodes.push(<Footnote key={`${keyPrefix}-cite-${citation.id}-${matchIndex}`} citation={citation} />);
      }
    } else if (matchStr.startsWith("**") && matchStr.endsWith("**")) {
      const boldText = matchStr.slice(2, -2);
      nodes.push(
        <strong key={`${keyPrefix}-bold-${matchIndex}`} className="font-semibold text-zinc-50">
          {boldText}
        </strong>,
      );
    } else if (matchStr.startsWith("`") && matchStr.endsWith("`")) {
      const codeText = matchStr.slice(1, -1);
      nodes.push(
        <code
          key={`${keyPrefix}-code-${matchIndex}`}
          className="rounded border border-white/[0.07] bg-well px-1 py-0.5 font-mono text-[11px] text-zinc-300"
        >
          {codeText}
        </code>,
      );
    }

    lastIndex = matchIndex + matchStr.length;
  }

  if (lastIndex < sanitized.length) {
    nodes.push(sanitized.slice(lastIndex));
  }

  return nodes;
}

/**
 * Markdown and citation renderer for Candidate Insights messages.
 * Formats bullet points, numbered lists, section headers and footnote-style citations,
 * then lists each cited source once at the foot of the message.
 */
export function CitedText({ text }: { text: string }): React.JSX.Element {
  // Strip trailing partial citation tag during streaming
  const visible = text.replace(/\[\[[^\]]*$/, "");
  const lines = visible.split(/\r?\n/);
  const citations = buildCitationIndex(visible);

  const elements: React.JSX.Element[] = [];
  let currentList: { type: "ul" | "ol"; items: React.ReactNode[] } | null = null;

  const flushList = (key: string) => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul key={key} className="my-2.5 space-y-2 pl-0.5">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-200">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" aria-hidden="true" />
              <div className="flex-1">{item}</div>
            </li>
          ))}
        </ul>,
      );
    } else {
      elements.push(
        <ol key={key} className="my-2.5 space-y-2 pl-0.5">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-200">
              <span className="mt-px min-w-4 text-sm text-zinc-500 tabular-nums">{idx + 1}.</span>
              <div className="flex-1">{item}</div>
            </li>
          ))}
        </ol>,
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine === undefined) continue;
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList(`flush-${i}`);
      continue;
    }

    // Headers (# through ####)
    const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch && headerMatch[2]) {
      flushList(`flush-${i}`);
      elements.push(
        <h4 key={`h-${i}`} className="mt-4 mb-1.5 text-sm font-semibold tracking-tight text-zinc-50">
          {renderInlineSpans(headerMatch[2], `h-${i}`, citations)}
        </h4>,
      );
      continue;
    }

    // Bullet list (* or - or •)
    const bulletMatch = trimmed.match(/^[*•\-]\s+(.+)$/);
    if (bulletMatch && bulletMatch[1]) {
      if (currentList && currentList.type !== "ul") {
        flushList(`flush-${i}`);
      }
      if (!currentList) {
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(renderInlineSpans(bulletMatch[1], `li-${i}`, citations));
      continue;
    }

    // Numbered list (1. ...)
    const numMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (numMatch && numMatch[1]) {
      if (currentList && currentList.type !== "ol") {
        flushList(`flush-${i}`);
      }
      if (!currentList) {
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(renderInlineSpans(numMatch[1], `oli-${i}`, citations));
      continue;
    }

    // Standard paragraph line
    flushList(`flush-${i}`);
    elements.push(
      <p key={`p-${i}`} className="my-2 text-sm leading-relaxed text-zinc-200">
        {renderInlineSpans(trimmed, `p-${i}`, citations)}
      </p>,
    );
  }

  flushList("final-flush");

  const sources = Array.from(citations.values());

  return (
    <div className="space-y-1">
      {elements}
      {sources.length > 0 && (
        <ol className="mt-4 space-y-1 border-t border-white/[0.04] pt-3" aria-label="Sources">
          {sources.map((source) => (
            <li key={source.id} className="flex items-baseline gap-2 text-xs text-zinc-500">
              <span className="min-w-4 tabular-nums">{source.n}.</span>
              <Link
                href={`/items/${source.id}`}
                className="truncate transition-colors hover:text-zinc-200 focus-visible:text-zinc-200 focus-visible:outline-none"
              >
                {source.title}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
