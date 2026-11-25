"use client";

import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import akvaiLogo from "../../public/images/akvai-logo.png";

const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Showcase", href: "#showcase" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E1D8] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-8 px-6">
        <a
          href="#top"
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
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium whitespace-nowrap shrink-0 text-[#4B4A46] transition-colors duration-150 hover:text-[#0D5C43] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0D5C43]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#contact"
            className="hidden min-h-10 items-center justify-center rounded-[3px] bg-[#E07A22] px-5 py-2 text-sm font-medium whitespace-nowrap shrink-0 text-[#1A1918] transition-colors duration-150 hover:bg-[#CF6C18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43] md:inline-flex"
          >
            Enquire
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
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
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-11 items-center text-sm font-medium text-[#2A2926] transition-colors hover:text-[#0D5C43]"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex min-h-11 items-center justify-center rounded-[3px] bg-[#E07A22] px-5 py-2.5 text-sm font-medium text-[#1A1918] transition-colors hover:bg-[#CF6C18]"
            >
              Enquire by email
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
