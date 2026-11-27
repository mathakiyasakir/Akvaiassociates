"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import akvaiLogo from "../../public/images/akvai-logo.png";
import { useApp } from "@/components/AppContext";

const HOME_ANCHORS = [
  { label: "Services", href: "#services" },
  { label: "Showcase", href: "#showcase" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const prefersReducedMotion = useReducedMotion();
  const { activeTab, setActiveTab, requireLoginOrRun } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigateToSection = (href: string) => {
    requireLoginOrRun(() => {
      setMobileOpen(false);
      if (activeTab !== "home") {
        setActiveTab("home");
        window.setTimeout(() => {
          const el = document.querySelector(href);
          el?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
        }, 60);
      } else {
        const el = document.querySelector(href);
        el?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E1D8] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-8 px-6">
        <button
          type="button"
          onClick={() =>
            requireLoginOrRun(() => {
              setActiveTab("home");
              window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? "auto" : "smooth",
              });
            }, "home")
          }
          aria-label="Akvai Associates Home"
          className="flex shrink-0 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0D5C43]"
        >
          <Image
            src={akvaiLogo}
            alt="Akvai Associates"
            width={92}
            height={60}
            priority
            referrerPolicy="no-referrer"
            className="h-12 w-auto object-contain"
          />
        </button>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 md:flex"
        >
          {HOME_ANCHORS.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => navigateToSection(link.href)}
              className="text-sm font-medium whitespace-nowrap shrink-0 text-[#4B4A46] transition-colors duration-150 hover:text-[#0D5C43] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0D5C43]"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <motion.button
            type="button"
            onClick={() => navigateToSection("#contact")}
            whileHover={prefersReducedMotion ? undefined : { y: -1 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            className="hidden min-h-10 items-center justify-center gap-1.5 rounded-[3px] bg-[#E07A22] px-5 py-2 text-sm font-medium whitespace-nowrap shrink-0 text-[#1A1918] shadow-xs transition-colors duration-150 hover:bg-[#CF6C18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43] md:inline-flex"
          >
            <span>Enquire</span>
            <ArrowUpRight className="h-4 w-4" />
          </motion.button>

          <button
            type="button"
            onClick={() =>
              requireLoginOrRun(() => setMobileOpen((prev) => !prev))
            }
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[3px] text-[#1C1B19] transition-colors duration-150 hover:bg-[#F4F1EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43] md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-[#E5E1D8] bg-white px-6 py-4 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {HOME_ANCHORS.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => navigateToSection(link.href)}
                className="flex min-h-11 items-center text-left text-sm font-medium text-[#2A2926] transition-colors hover:text-[#0D5C43]"
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigateToSection("#contact")}
              className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-5 py-2.5 text-sm font-medium text-[#1A1918] transition-colors hover:bg-[#CF6C18]"
            >
              <span>Enquire now</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
