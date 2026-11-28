"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { useApp, type AppTab } from "@/components/AppContext";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";

interface ProtectedPageShellProps {
  tab: AppTab;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function ProtectedPageShell({
  tab,
  title,
  subtitle,
  children,
}: ProtectedPageShellProps) {
  const prefersReducedMotion = useReducedMotion();
  const { user, authReady, requireLoginOrRun } = useApp();

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1C1B19]">
      <Navbar />

      {!authReady ? (
        <main className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center justify-center px-6 pb-24">
          <div className="flex items-center gap-3 text-sm font-medium text-[#585651]">
            <Loader2 className="h-5 w-5 animate-spin text-[#0D5C43]" />
            <span>Restoring your studio session...</span>
          </div>
        </main>
      ) : !user ? (
        <main className="mx-auto flex min-h-[calc(100vh-144px)] max-w-xl items-center px-6 py-16 pb-28">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full border border-[#DDD8CE] bg-white p-8 shadow-sm sm:p-10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-[#E5EFEA] text-[#0D5C43]">
              <Lock className="h-5 w-5" />
            </div>
            <p className="mt-5 text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
              AKVAI ASSOCIATES
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-[#1C1B19]">
              {title}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-[#585651]">
              {subtitle}
            </p>
            <motion.button
              type="button"
              onClick={() => requireLoginOrRun(() => {}, tab)}
              whileHover={prefersReducedMotion ? undefined : { y: -1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-6 py-3 text-sm font-semibold text-[#1A1918] transition-colors hover:bg-[#CF6C18]"
            >
              <span>Sign in to continue</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        </main>
      ) : (
        <main>{children}</main>
      )}

      <BottomNav />
    </div>
  );
}
