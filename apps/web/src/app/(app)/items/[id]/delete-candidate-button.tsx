"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function DeleteCandidateButton({
  candidateId,
  candidateName,
}: {
  candidateId: string;
  candidateName: string;
}): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/items?id=${encodeURIComponent(candidateId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete candidate.");
      }

      toast.success(data?.message || "Candidate profile deleted successfully.");
      setOpen(false);
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete candidate.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 cursor-pointer gap-2 border border-zinc-800/80 bg-zinc-900/40 text-xs font-medium text-zinc-400 hover:border-rose-900/60 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
        title={`Delete ${candidateName}`}
      >
        <Trash2 className="h-3.5 w-3.5 text-zinc-500 hover:text-rose-400 transition-colors" aria-hidden="true" />
        <span>Delete profile</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border border-border bg-[#11141a] text-white shadow-2xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle className="font-serif text-xl font-normal tracking-tight text-white">
              Delete Candidate Dossier?
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-zinc-400">
              Are you sure you want to delete <span className="font-medium text-white">{candidateName}</span>?
              All extracted evidence, match score benchmarks, screening questions, and evaluation notes will be
              permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-5 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
              className="cursor-pointer text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="cursor-pointer gap-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 h-9 shadow-xs"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Deleting candidate...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Permanently delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
