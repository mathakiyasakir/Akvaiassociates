"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ClipboardList,
  Layers,
  LogOut,
  Mail,
  User,
} from "lucide-react";
import { useApp } from "@/components/AppContext";

export function ProfileTabView() {
  const prefersReducedMotion = useReducedMotion();
  const { user, orders, siteConfig, setActiveTab, logout } = useApp();

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-144px)] bg-[#F4F1EA] pb-28">
      <section className="mx-auto max-w-4xl px-6 py-12 lg:py-16">
        <p className="text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
          ACCOUNT PROFILE
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-4xl">
          {user.name}
        </h1>
        <p className="mt-2 text-sm text-[#585651]">
          Manage your Akvai Associates account and view your active
          architectural requests.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="border border-[#E4E0D7] bg-white p-7 md:col-span-7">
            <div className="flex items-center gap-4 border-b border-[#F0ECE4] pb-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[4px] bg-[#E5EFEA] text-[#0D5C43]">
                <User className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-[#1C1B19]">
                  {user.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-[#585651]">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-[#0D5C43]" />
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-[#6B6963]">Membership</dt>
                <dd className="mt-1 font-semibold text-[#1C1B19]">
                  Verified Client
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#6B6963]">Submitted Orders</dt>
                <dd className="mt-1 font-mono font-semibold tabular-nums text-[#0D5C43]">
                  {orders.length}
                </dd>
              </div>
            </dl>

            <div className="mt-7 flex flex-wrap gap-3 border-t border-[#F0ECE4] pt-5">
              <motion.button
                type="button"
                onClick={() => setActiveTab("orders")}
                whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                className="inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-[#D4CFC4] bg-[#FAF9F5] px-4 py-2 text-sm font-medium text-[#1C1B19] transition-colors hover:bg-[#ECE8DF]"
              >
                <ClipboardList className="h-4 w-4 text-[#0D5C43]" />
                <span>View My Orders</span>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => {
                  void logout();
                }}
                whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                className="inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-[#DFC7BF] bg-[#FDF5F2] px-4 py-2 text-sm font-medium text-[#9A3412] transition-colors hover:bg-[#FAE6DE]"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </motion.button>
            </div>
          </div>

          <div className="border border-[#1F1F1D] bg-[#1F1F1D] p-7 text-white md:col-span-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#E08A3C]">
              STUDIO CONCIERGE
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-white">
              Start a new space
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#BFBDB7]">
              Ready to plan a new residence, interior transformation, or 3D
              visualization study with our architects?
            </p>

            <div className="mt-6 space-y-3">
              <motion.button
                type="button"
                onClick={() => setActiveTab("service")}
                whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-5 py-2.5 text-sm font-semibold text-[#1A1918] transition-colors hover:bg-[#CF6C18]"
              >
                <Layers className="h-4 w-4" />
                <span>Explore Services</span>
              </motion.button>

              <a
                href={`mailto:${siteConfig.brand.contactEmail}`}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[3px] border border-[#3E3E39] px-4 py-2.5 text-sm font-medium text-[#DDDCD6] transition-colors hover:border-[#6A6A62] hover:text-white"
              >
                <span>Email Our Studio</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
