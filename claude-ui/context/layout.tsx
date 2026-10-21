"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  Compass,
  Loader2,
  LogOut,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "@/components/ui/sonner";
import { domain } from "@/lib/domain";

/**
 * Entrance and ambient motion shared across the application shell.
 * Staggered fade and lift with smooth GPU-accelerated drift.
 */
const SHELL_MOTION_CSS = `
@keyframes tr-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes tr-fade{from{opacity:0}to{opacity:1}}
@keyframes tr-ambient-drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, 30px) scale(1.08); }
}
@keyframes tr-ambient-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-35px, -25px) scale(0.95); }
}
@keyframes tr-ambient-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-25px, 35px) scale(1.05); }
}
.tr-rise{animation:tr-rise .4s cubic-bezier(.22,1,.36,1) both}
.tr-fade{animation:tr-fade .3s ease-out both}
.tr-ambient-1 { animation: tr-ambient-drift-1 24s ease-in-out infinite; }
.tr-ambient-2 { animation: tr-ambient-drift-2 28s ease-in-out infinite; }
.tr-ambient-3 { animation: tr-ambient-drift-3 32s ease-in-out infinite; }
@media (prefers-reduced-motion:reduce){
  .tr-rise,.tr-fade,.tr-ambient-1,.tr-ambient-2,.tr-ambient-3{animation:none}
}
`;

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { data: session, isPending } = authClient.useSession();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isAnonymous = Boolean(
    session?.user && ("isAnonymous" in session.user ? session.user.isAnonymous : false),
  );
  const isDemo =
    !isAnonymous &&
    /demo/i.test(`${session?.user?.name ?? ""} ${session?.user?.email ?? ""}`);
  const accountLabel = isAnonymous
    ? "Anonymous Guest"
    : isDemo
      ? "Demo User"
      : session?.user?.name || session?.user?.email || "Signed in";

  const router = useRouter();
  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await authClient.signOut();
      router.push("/");
    } catch {
      toast.error("Failed to sign out");
      setSigningOut(false);
    }
  };

  const handleUpgradeAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeEmail.trim()) return;
    try {
      setUpgrading(true);
      toast.success(`Verification link sent to ${upgradeEmail}`);
      setUpgradeOpen(false);
      setUpgradeEmail("");
    } catch {
      toast.error("Failed to link account");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <style>{SHELL_MOTION_CSS}</style>

      {/* Ambient drifting chromatic illumination */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="tr-ambient-1 absolute -top-40 left-1/4 h-[450px] w-[550px] rounded-full bg-indigo-500/20 blur-[80px]" />
        <div className="tr-ambient-2 absolute top-1/3 -right-32 h-[450px] w-[500px] rounded-full bg-sky-500/18 blur-[80px]" />
        <div className="tr-ambient-3 absolute -bottom-24 left-1/3 h-[400px] w-[500px] rounded-full bg-emerald-500/15 blur-[80px]" />
      </div>

      <header className="sticky top-0 z-40 flex h-12 w-full items-center justify-between border-b border-white/[0.07] bg-background/85 px-4 backdrop-blur-md sm:px-6">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2.5 rounded-md focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="flex size-7 items-center justify-center rounded-md border border-white/[0.07] bg-card shadow-raised transition-colors group-hover:border-white/15">
            <Compass className="size-3.5 text-zinc-300" aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold tracking-[0.14em] text-zinc-100 uppercase">
            {domain.labels.product}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isPending ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              <span>Loading session</span>
            </div>
          ) : session?.user ? (
            <>
              <span className="inline-flex max-w-[180px] items-center gap-2 rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-xs text-zinc-300">
                <span
                  className={`size-1.5 shrink-0 rounded-full ${
                    isAnonymous ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{accountLabel}</span>
              </span>

              {isAnonymous && (
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(true)}
                  className="hidden cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:inline-flex"
                >
                  Upgrade account
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                </button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
                className="h-7 cursor-pointer gap-1.5 px-2 text-xs text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                title="Sign out"
              >
                {signingOut ? (
                  <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <LogOut className="size-3.5" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Sign out</span>
                <span className="sr-only sm:hidden">Sign out</span>
              </Button>
            </>
          ) : (
            <Link href="/">
              <Button size="sm" variant="default" className="h-7 cursor-pointer text-xs">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <Toaster />

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="gap-0 rounded-lg border border-white/[0.08] bg-card p-5 text-white shadow-2xl sm:max-w-md">
          <form onSubmit={handleUpgradeAccount}>
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-base font-semibold tracking-tight text-white">
                Keep your work
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed text-zinc-400">
                Convert your anonymous session into a permanent account to preserve your candidates,
                chat threads, and AI analysis across devices.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <div className="space-y-1.5">
                <label htmlFor="upgrade-email" className="text-xs font-medium text-zinc-300">
                  Email address
                </label>
                <Input
                  id="upgrade-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={upgradeEmail}
                  onChange={(e) => setUpgradeEmail(e.target.value)}
                  className="h-8 rounded-md border-input bg-well text-[13px] text-zinc-50 placeholder:text-zinc-500"
                />
              </div>
              <div className="flex items-start gap-2 rounded-md border border-white/5 bg-well p-2.5 text-xs leading-relaxed text-zinc-400">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                <p>Everything created during this anonymous session stays linked to your account.</p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUpgradeOpen(false)}
                className="h-8 cursor-pointer text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={upgrading || !upgradeEmail.trim()}
                className="h-8 cursor-pointer gap-1.5 text-xs"
              >
                {upgrading && (
                  <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                )}
                Upgrade account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
