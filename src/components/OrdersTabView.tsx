"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Layers,
  MapPin,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";
import { useApp } from "@/components/AppContext";
import type { OrderStatus } from "@/lib/types";

const STEPS: OrderStatus[] = ["Pending", "In Review", "In Progress", "Completed"];

function getStepIndex(status: OrderStatus): number {
  const idx = STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export function OrdersTabView() {
  const prefersReducedMotion = useReducedMotion();
  const { orders, loadingData, refreshOrders, setActiveTab } = useApp();

  return (
    <div className="min-h-[calc(100vh-144px)] bg-[#F4F1EA] pb-28">
      <section className="mx-auto max-w-5xl px-6 py-12 lg:py-16">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
              PROJECT TRACKER
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-4xl">
              Your Service Orders
            </h1>
            <p className="mt-2 text-sm text-[#585651]">
              Track every architectural request and see live updates from our
              architects.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              onClick={() => void refreshOrders()}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              className="inline-flex min-h-10 items-center gap-2 rounded-[3px] border border-[#D4CFC4] bg-white px-4 py-2 text-sm font-medium text-[#1C1B19] transition-colors hover:bg-[#ECE8DF]"
            >
              <RefreshCw className={`h-4 w-4 ${loadingData ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setActiveTab("service")}
              whileHover={prefersReducedMotion ? undefined : { y: -1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className="inline-flex min-h-10 items-center gap-2 rounded-[3px] bg-[#E07A22] px-4 py-2 text-sm font-medium text-[#1A1918] transition-colors hover:bg-[#CF6C18]"
            >
              <Layers className="h-4 w-4" />
              <span>New Service Request</span>
            </motion.button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="mt-10 border border-[#E4E0D7] bg-white p-10 text-center sm:p-14">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[4px] bg-[#E5EFEA] text-[#0D5C43]">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-bold text-[#1C1B19]">
              No service orders yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#585651]">
              Explore our architectural services and submit a project brief to
              track design milestones here.
            </p>
            <motion.button
              type="button"
              onClick={() => setActiveTab("service")}
              whileHover={prefersReducedMotion ? undefined : { y: -1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[3px] bg-[#E07A22] px-6 py-2.5 text-sm font-medium text-[#1A1918] transition-colors hover:bg-[#CF6C18]"
            >
              <Layers className="h-4 w-4" />
              <span>Browse Services</span>
            </motion.button>
          </div>
        ) : (
          <div className="mt-10 space-y-5">
            {orders.map((order) => {
              const currentIdx = getStepIndex(order.status);
              const isCancelled = order.status === "Cancelled";
              return (
                <article
                  key={order.id}
                  className="border border-[#E4E0D7] bg-white p-6 sm:p-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#F0ECE4] pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6963]">
                        <span className="font-mono font-semibold text-[#0D5C43]">
                          {order.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{order.projectType}</span>
                        <span aria-hidden="true">·</span>
                        <span>{order.budgetRange}</span>
                      </div>
                      <h2 className="mt-1.5 font-sans text-xl font-semibold text-[#1C1B19]">
                        {order.serviceTitle}
                      </h2>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-xs font-semibold tracking-[0.08em] ${
                          isCancelled
                            ? "text-[#9A3412]"
                            : order.status === "Completed"
                            ? "text-[#0D5C43]"
                            : "text-[#B85A17]"
                        }`}
                      >
                        Status: {order.status}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-[#75736D]">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[#4E4C47]">
                    {order.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#6B6963]">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#0D5C43]" />
                      <span>{order.location}</span>
                    </span>
                  </div>

                  {!isCancelled && (
                    <div className="mt-6 grid grid-cols-4 gap-2 border-t border-[#F0ECE4] pt-5">
                      {STEPS.map((step, idx) => {
                        const reached = idx <= currentIdx;
                        return (
                          <div key={step} className="space-y-1.5">
                            <div
                              className={`h-1.5 w-full transition-colors ${
                                reached ? "bg-[#0D5C43]" : "bg-[#E6E2D9]"
                              }`}
                            />
                            <p
                              className={`flex items-center gap-1 text-[11px] font-medium ${
                                reached ? "text-[#0D5C43]" : "text-[#8C8A83]"
                              }`}
                            >
                              {reached && (
                                <CheckCircle2 className="hidden h-3 w-3 shrink-0 sm:inline" />
                              )}
                              <span className="truncate">{step}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {order.adminNote && (
                    <div className="mt-5 border border-[#DCE6E1] bg-[#F3F8F5] p-4">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-[#0D5C43]">
                        <MessageSquareText className="h-3.5 w-3.5" />
                        <span>Architect Update</span>
                      </p>
                      <p className="mt-1.5 text-sm text-[#2A3B34]">
                        {order.adminNote}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
