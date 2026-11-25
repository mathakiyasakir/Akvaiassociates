"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Box,
  Building2,
  ChevronDown,
  LayoutGrid,
  Ruler,
} from "lucide-react";

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  description: string;
  deliverables: string[];
  icon: "building" | "grid" | "ruler" | "box";
}

export const SERVICES: ServiceItem[] = [
  {
    id: "architecture",
    number: "01 /",
    title: "Architecture",
    description:
      "Distinctive residential and commercial spaces grounded in context and everyday use.",
    deliverables: [
      "Site analysis, massing & schematic concepts",
      "Architectural working drawings & elevations",
      "Material specification & site coordination",
    ],
    icon: "building",
  },
  {
    id: "interior-design",
    number: "02 /",
    title: "Interior Design",
    description:
      "Considered interiors that bring material, light, and human experience together.",
    deliverables: [
      "Spatial zoning, circulation & lighting mood",
      "Bespoke joinery, finishes & material palettes",
      "Furniture curation & styling direction",
    ],
    icon: "grid",
  },
  {
    id: "planning-design",
    number: "03 /",
    title: "Planning & Design",
    description:
      "Practical space planning and design development for a confident project journey.",
    deliverables: [
      "Functional floor layouts & feasibility studies",
      "Regulatory alignment & build phasing",
      "Technical detailing for seamless execution",
    ],
    icon: "ruler",
  },
  {
    id: "3d-visualization",
    number: "04 /",
    title: "3D Visualization",
    description:
      "Immersive visual studies that make ideas easier to see, discuss, and refine.",
    deliverables: [
      "Photorealistic exterior & interior renders",
      "Daylight, shadow & material comparisons",
      "Client walkthrough frames before construction",
    ],
    icon: "box",
  },
];

function ServiceIcon({ icon }: { icon: ServiceItem["icon"] }) {
  const iconClass = "h-5 w-5 text-[#0D5C43]";
  switch (icon) {
    case "building":
      return <Building2 className={iconClass} strokeWidth={1.75} />;
    case "grid":
      return <LayoutGrid className={iconClass} strokeWidth={1.75} />;
    case "ruler":
      return <Ruler className={iconClass} strokeWidth={1.75} />;
    case "box":
      return <Box className={iconClass} strokeWidth={1.75} />;
  }
}

interface ServicesSectionProps {
  onSelectService: (serviceTitle: string) => void;
}

export function ServicesSection({ onSelectService }: ServicesSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <section
      id="services"
      className="border-t border-[#E4E0D7] bg-[#F4F1EA] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
            WHAT WE DO
          </p>
          <h2 className="mt-3 text-balance font-serif text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-4xl">
            Every detail has a purpose.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#585651]">
            Connected architectural services to guide your idea from possibility
            to place.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {SERVICES.map((service, index) => {
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
                      className="inline-flex min-h-9 items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 text-[#585651] transition-colors duration-150 hover:text-[#0D5C43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43]"
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
                        Included in this discipline
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
                      <a
                        href="#contact"
                        onClick={() => onSelectService(service.title)}
                        className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium whitespace-nowrap text-[#0D5C43] transition-colors hover:text-[#094230]"
                      >
                        <span>Enquire about {service.title}</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
