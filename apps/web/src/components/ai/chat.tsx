"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Send,
  FileSearch,
  User,
  RotateCcw,
  AlertCircle,
  Wrench,
  ChevronDown,
  ChevronUp,
  Loader2,
  Square,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CitedText } from "@/components/ai/cited-text";
import { domain } from "@/lib/domain";

export interface ChatProps {
  threadId?: string;
  itemId?: string;
  initialMessages?: unknown[];
}

function ToolCard({
  toolName,
  state,
  input,
  output,
  errorText,
}: {
  toolName: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isComplete = state === "output-available";
  const isError = state === "output-error" || Boolean(errorText);

  return (
    <div className="my-2 rounded-xl border border-white/[0.07] bg-card p-4 text-xs">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Wrench className="size-3.5 text-zinc-500" aria-hidden="true" />
          <span className="font-semibold text-foreground">Tool: {toolName}</span>
          {isComplete && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 bg-sage/10 text-sage border-sage/20"
            >
              Completed
            </Badge>
          )}
          {isError && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
              Failed
            </Badge>
          )}
          {!isComplete && !isError && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 animate-pulse">
              Running...
            </Badge>
          )}
        </div>
        <button type="button" className="text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-2.5 space-y-2 border-t border-border pt-2">
          {input !== undefined && (
            <div>
              <div className="font-medium text-muted-foreground mb-0.5">Input:</div>
              <pre className="overflow-x-auto rounded bg-muted p-2 font-mono text-[11px] text-foreground">
                {typeof input === "string" ? input : JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
          {output !== undefined && (
            <div>
              <div className="font-medium text-muted-foreground mb-0.5">Result:</div>
              <pre className="overflow-x-auto rounded bg-muted p-2 font-mono text-[11px] text-foreground">
                {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
          {errorText && (
            <div>
              <div className="font-medium text-destructive mb-0.5">Error:</div>
              <p className="rounded bg-destructive/10 p-2 text-[11px] text-destructive font-mono">
                {errorText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function renderMessagePart(part: UIMessage["parts"][number], index: number) {
  switch (part.type) {
    case "text":
      return (
        <div key={index} className="leading-relaxed">
          <CitedText text={part.text} />
        </div>
      );
    case "reasoning":
      return (
        <div
          key={index}
          className="my-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3.5 text-xs leading-relaxed text-zinc-400"
        >
          <div className="mb-1 font-medium text-zinc-300">Reasoning</div>
          <div className="whitespace-pre-wrap">{part.text}</div>
        </div>
      );
    case "source-url":
      return (
        <div key={index} className="my-1 text-xs">
          <a
            href={part.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Source: {part.title || part.url}
          </a>
        </div>
      );
    case "source-document":
      return (
        <div
          key={index}
          className="my-1 rounded border border-border bg-muted/30 p-2 text-xs text-muted-foreground"
        >
          Document: <span className="font-medium text-foreground">{part.title}</span> ({part.mediaType})
        </div>
      );
    case "file":
      return (
        <div key={index} className="my-1 text-xs text-muted-foreground">
          File: <span className="font-medium text-foreground">{part.filename || part.mediaType}</span>
        </div>
      );
    case "reasoning-file":
      return (
        <div key={index} className="my-1 text-xs text-muted-foreground font-mono">
          Reasoning File: {part.mediaType} ({part.url})
        </div>
      );
    case "step-start":
      return null;
    case "dynamic-tool":
      return (
        <ToolCard
          key={index}
          toolName={part.toolName}
          state={part.state}
          input={part.input}
          output={"output" in part ? part.output : undefined}
          errorText={"errorText" in part ? part.errorText : undefined}
        />
      );
    default: {
      const rawPart = part as { type: string; [key: string]: unknown };
      if (typeof rawPart.type === "string" && rawPart.type.startsWith("tool-")) {
        const toolName = rawPart.type.replace(/^tool-/, "");
        return (
          <ToolCard
            key={index}
            toolName={toolName}
            state={typeof rawPart.state === "string" ? rawPart.state : undefined}
            input={rawPart.input}
            output={rawPart.output}
            errorText={typeof rawPart.errorText === "string" ? rawPart.errorText : undefined}
          />
        );
      }
      if (typeof rawPart.type === "string" && rawPart.type.startsWith("data-")) {
        return null;
      }
      // Safe default fallback for any unhandled part type (e.g. AI SDK future additions)
      return null;
    }
  }
}

export function Chat({
  threadId,
  itemId,
  initialMessages,
}: ChatProps): React.JSX.Element {
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          ...(threadId ? { threadId } : {}),
          ...(itemId ? { itemId } : {}),
        },
      }),
    [threadId, itemId]
  );

  const { messages, status, error, sendMessage, regenerate, stop } = useChat({
    transport,
    messages: initialMessages as UIMessage[] | undefined,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    // Never auto-scroll the browser window on initial page mount (keeps dossier view at the top)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only scroll the internal chat message list, never the window/page
    if (scrollContainerRef.current && (messages.length > 0 || isStreaming)) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, status, isStreaming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    await sendMessage({ text: trimmed });
  };

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
  };

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-zinc-400">
            <MessageSquare className="size-4" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-medium tracking-tight text-zinc-100">Candidate Insights</h3>
              {itemId && (
                <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="size-1.5 rounded-full bg-sage" aria-hidden="true" />
                  Based on this profile
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">Answers cite the part of the profile they come from.</p>
          </div>
        </div>

        {isStreaming && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={stop}
            className="h-7 cursor-pointer border-white/10 bg-white/[0.04] px-2.5 text-xs text-zinc-300 hover:bg-white/[0.08] hover:text-white"
          >
            <Square className="mr-1 size-3" aria-hidden="true" />
            Stop
          </Button>
        )}
      </div>

      {/* Message List */}
      <div ref={scrollContainerRef} className="flex-1 space-y-5 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-white/[0.07] bg-well text-zinc-400">
              <FileSearch className="size-5" aria-hidden="true" />
            </div>
            <h4 className="mb-2 font-serif text-lg font-normal tracking-tight text-zinc-50">
              Inquire about candidate experience
            </h4>
            <p className="mb-6 max-w-sm text-xs leading-relaxed text-zinc-400">
              Check specific career claims, compare experience against the role&apos;s requirements, or
              draft follow-up interview questions.
            </p>
            <div className="flex max-w-lg flex-wrap justify-center gap-2">
              {domain.quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="cursor-pointer rounded-lg border border-white/[0.07] bg-well px-3.5 py-2 text-xs text-zinc-300 transition-colors select-none hover:border-white/15 hover:text-white focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-zinc-400 select-none">
                    <MessageSquare className="size-3.5" aria-hidden="true" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm ${
                    isUser
                      ? "rounded-tr-md border border-white/[0.08] bg-white/[0.06] text-zinc-100"
                      : "rounded-tl-md border border-white/[0.05] bg-well text-zinc-200"
                  }`}
                >
                  <div className="space-y-1.5 leading-relaxed">
                    {message.parts.map((part, index) => renderMessagePart(part, index))}
                  </div>
                </div>
                {isUser && (
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-zinc-400 select-none">
                    <User className="size-3.5" aria-hidden="true" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Streaming status inside the list */}
        {isStreaming && (
          <div className="flex items-center gap-2 pl-10 text-xs text-zinc-500" role="status">
            <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            <span>Searching profile...</span>
          </div>
        )}
      </div>

      {/* Error state with retry */}
      {(error || status === "error") && (
        <div className="flex items-center justify-between gap-2 border-t border-terracotta/20 bg-terracotta/5 px-5 py-2.5 text-xs text-terracotta">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {error?.message || "Something went wrong while loading the answer."}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => regenerate()}
            className="h-7 shrink-0 cursor-pointer gap-1 border-terracotta/30 text-xs hover:bg-terracotta/10"
          >
            <RotateCcw className="size-3" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 border-t border-white/[0.04] bg-well/40 p-4"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isStreaming
              ? "Searching profile..."
              : "Ask about this candidate's skills, tenure, or gaps..."
          }
          disabled={isStreaming}
          aria-label="Ask about this candidate"
          className="h-10 flex-1 border-input bg-well text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!input.trim() || isStreaming}
          className="h-10 cursor-pointer gap-2 bg-zinc-100 px-4 font-medium text-zinc-950 transition-colors hover:bg-white disabled:opacity-40 disabled:hover:bg-zinc-100"
        >
          {isStreaming ? (
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          <span className="text-xs font-semibold">Send</span>
        </Button>
      </form>
    </div>
  );
}
