"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Check, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FitBadge } from "@/components/ui/foundry";

export type CompareCandidateOption = {
  id: string;
  name: string;
  score?: number;
  headline?: string;
  yearsOfExperience?: number;
};

export function CompareCandidateButton({
  currentCandidateId,
  currentCandidateName,
  candidates,
}: {
  currentCandidateId: string;
  currentCandidateName: string;
  candidates: CompareCandidateOption[];
}): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const otherCandidates = candidates.filter((c) => c.id !== currentCandidateId);
  const filtered = otherCandidates.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.headline && c.headline.toLowerCase().includes(q));
  });

  const handleSelect = (otherId: string) => {
    setOpen(false);
    router.push(`/compare?a=${currentCandidateId}&b=${otherId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white">
        <ArrowLeftRight className="size-3 text-steel" aria-hidden="true" />
        <span>Compare</span>
      </DialogTrigger>

      <DialogContent className="max-w-md border-white/[0.08] bg-card p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-normal text-zinc-100">
            Compare Candidate
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Select another candidate from your pipeline to compare side-by-side with{" "}
            <strong className="text-zinc-200">{currentCandidateName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate by name or role..."
              className="h-9 border-white/[0.08] bg-white/[0.03] pl-9 text-xs text-zinc-200 placeholder:text-zinc-500"
            />
          </div>

          <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-500">
                {otherCandidates.length === 0
                  ? "No other candidates found in this pipeline."
                  : "No matching candidates found."}
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent p-2.5 text-left transition-colors hover:border-white/[0.08] hover:bg-white/[0.05]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-medium text-zinc-200">{c.name}</span>
                      {c.yearsOfExperience !== undefined && (
                        <span className="text-[10px] text-zinc-500 tabular-nums">
                          · {c.yearsOfExperience} yrs
                        </span>
                      )}
                    </div>
                    {c.headline && (
                      <p className="mt-0.5 truncate text-[11px] text-zinc-400">{c.headline}</p>
                    )}
                  </div>
                  <FitBadge score={c.score} className="shrink-0 text-[10px]" />
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
