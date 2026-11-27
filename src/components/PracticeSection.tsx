"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useApp } from "@/components/AppContext";

interface PracticeSectionProps {
  kicker: string;
  headline: string;
  paragraph1: string;
  paragraph2: string;
  visualCaption: string;
  disciplines: string[];
}

export function PracticeSection({
  kicker,
  headline,
  paragraph1,
  paragraph2,
  visualCaption,
  disciplines,
}: PracticeSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const { requireLoginOrRun } = useApp();

  return (
    <section
      id="about"
      className="border-t border-[#E4E0D7] bg-[#F4F1EA] py-20 lg:py-28"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-10 px-6 lg:grid-cols-12 lg:gap-14">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative min-h-[300px] overflow-hidden bg-[#0A5A42] sm:min-h-[360px] lg:col-span-6 lg:min-h-[400px]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-12 left-[22%] h-[138%] w-[64%] rotate-[27deg] border-[22px] border-[#DF7324] sm:border-[26px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#063E2D]/70 via-transparent to-transparent"
          />

          <a
            href="#contact"
            onClick={(event) => {
              event.preventDefault();
              requireLoginOrRun(() => {
                document.querySelector("#contact")?.scrollIntoView({
                  behavior: prefersReducedMotion ? "auto" : "smooth",
                });
              });
            }}
            className="group absolute right-6 bottom-6 left-6 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:bottom-8 sm:left-8"
          >
            <span>{visualCaption}</span>
            <ArrowUpRight className="h-4 w-4 text-[#F29649] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            duration: 0.45,
            delay: prefersReducedMotion ? 0 : 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex flex-col justify-center lg:col-span-6"
        >
          <p className="text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
            {kicker}
          </p>
          <h2 className="mt-3 text-balance font-serif text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-4xl">
            {headline}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[#55534E]">
            {paragraph1}
          </p>
          <p className="mt-4 text-base leading-relaxed text-[#55534E]">
            {paragraph2}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#DED9CE] pt-6 text-xs font-medium tracking-[0.1em] text-[#5B5953]">
            {disciplines.map((item, idx) => (
              <span key={`${item}-${idx}`} className="inline-flex items-center gap-4">
                {idx > 0 && (
                  <span aria-hidden="true" className="text-[#C2BDB2]">
                    ·
                  </span>
                )}
                <span>{item}</span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
