"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ChevronDown, ClipboardPlus } from "lucide-react";
import { ServiceIcon } from "@/components/ServiceIcon";
import { useApp } from "@/components/AppContext";
import type { ServiceItem } from "@/lib/types";

interface ServicesSectionProps {
  kicker: string;
  headline: string;
  subtitle: string;
  services: ServiceItem[];
  onSelectService: (serviceTitle: string) => void;
  onOpenServiceTab: () => void;
}

export function ServicesSection({
  kicker,
  headline,
  subtitle,
  services,
  onSelectService,
  onOpenServiceTab,
}: ServicesSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const { requireLoginOrRun } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleServices = services.filter((s) => s.enabled);

  const toggleExpand = (id: string) => {
    requireLoginOrRun(() => {
      setExpandedId((current) => (current === id ? null : id));
    });
  };

  return (
    <section
      id="services"
      className="border-t border-[#E4E0D7] bg-[#F4F1EA] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
              {kicker}
            </p>
            <h2 className="mt-3 text-balance font-serif text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-4xl">
              {headline}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#585651]">
              {subtitle}
            </p>
          </div>

          <motion.button
            type="button"
            onClick={() => requireLoginOrRun(onOpenServiceTab, "service")}
            whileHover={prefersReducedMotion ? undefined : { y: -1 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-[3px] border border-[#0D5C43] bg-white px-5 py-2.5 text-sm font-medium whitespace-nowrap shrink-0 text-[#0D5C43] transition-colors duration-150 hover:bg-[#E5EFEA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43] sm:self-auto"
          >
            <ClipboardPlus className="h-4 w-4" />
            <span>Book a Service</span>
          </motion.button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {visibleServices.map((service, index) => {
            const isExpanded = expandedId === service.id;
            return (
              <motion.article
                key={service.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.4,
                  delay: prefersReducedMotion ? 0 : index * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col justify-between border border-[#E4E0D7] bg-white p-7 transition-colors duration-150 hover:border-[#CBC5B8] sm:p-8"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-mono text-xs font-medium tabular-nums text-[#0D5C43]">
                      {service.number}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleExpand(service.id)}
                      aria-expanded={isExpanded}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 text-[#4F4D48] transition-colors duration-150 hover:bg-[#F4F1EA] hover:text-[#0D5C43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43]"
                    >
                      <span>{isExpanded ? "Hide scope" : "View scope"}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-[3px] bg-[#E5EFEA]">
                    <ServiceIcon icon={service.icon} />
                  </div>

                  <h3 className="mt-5 font-sans text-xl font-semibold tracking-tight text-[#1C1B19]">
                    {service.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#5C5A55] sm:text-[15px]">
                    {service.description}
                  </p>

                  {isExpanded && (
                    <div className="mt-5 border-t border-[#ECE8E0] pt-4">
                      <p className="text-xs font-semibold tracking-[0.08em] text-[#0D5C43]">
                        Included deliverables · {service.timeline}
                      </p>
                      <ul className="mt-2.5 space-y-2 text-sm text-[#4A4945]">
                        {service.deliverables.map((point) => (
                          <li key={point} className="flex items-start gap-2.5">
                            <span
                              aria-hidden="true"
                              className="mt-2 h-1 w-3 shrink-0 bg-[#DF7324]"
                            />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#F0ECE4] pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold tabular-nums text-[#1C1B19]">
                      {service.priceInr > 0
                        ? `₹${service.priceInr.toLocaleString("en-IN")}`
                        : "Custom Quote"}
                    </span>
                    <span className="text-xs text-[#6B6963]">
                      · {service.timeline}
                    </span>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => {
                      requireLoginOrRun(() => {
                        onSelectService(service.title);
                        onOpenServiceTab();
                      }, "service");
                    }}
                    whileHover={prefersReducedMotion ? undefined : { x: 2 }}
                    className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium whitespace-nowrap text-[#0D5C43] transition-colors hover:text-[#08402E]"
                  >
                    <span>Book now</span>
                    <ArrowUpRight className="h-4 w-4 text-[#DF7324]" />
                  </motion.button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
