"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ArchitecturalHeroModel } from "@/components/ArchitecturalHeroModel";
import { ServicesSection } from "@/components/ServicesSection";
import { ShowcaseSection } from "@/components/ShowcaseSection";
import { PracticeSection } from "@/components/PracticeSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";

export function AkvaiHomeShell() {
  const [selectedService, setSelectedService] = useState("Architecture");

  return (
    <div id="top" className="min-h-screen bg-[#F4F1EA] text-[#1C1B19]">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pt-12 pb-16 lg:grid-cols-12 lg:gap-12 lg:pt-20 lg:pb-24">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
              <span>AKVAI ASSOCIATES</span>
              <span aria-hidden="true" className="mx-2 text-[#8EA69B]">
                /
              </span>
              <span>ARCHITECTURAL PRACTICE</span>
            </p>

            <h1 className="mt-4 max-w-xl text-balance font-serif text-[clamp(2.35rem,4.6vw,3.9rem)] leading-[1.1] font-bold tracking-tight text-[#1C1B19]">
              Spaces shaped for the way you live.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#575550] sm:text-lg">
              Thoughtful architecture from the first sketch to the final detail.
              We bring clarity, character, and purpose to every space.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a
                href="#services"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-6 py-3 text-sm font-medium whitespace-nowrap shrink-0 text-[#1A1918] transition-colors duration-150 hover:bg-[#CF6C18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43]"
              >
                <span>Explore services</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href="#about"
                className="inline-flex min-h-12 items-center justify-center rounded-[3px] border border-[#2C2B28] bg-transparent px-6 py-3 text-sm font-medium whitespace-nowrap shrink-0 text-[#1C1B19] transition-colors duration-150 hover:bg-[#E9E5DB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43]"
              >
                View our approach
              </a>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-[1.5px] w-9 shrink-0 bg-[#DF7324]"
              />
              <p className="text-xs font-medium text-[#64625C]">
                Designed with intention. Built for living.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6">
            <ArchitecturalHeroModel />
          </div>
        </section>

        <ServicesSection onSelectService={setSelectedService} />
        <ShowcaseSection />
        <PracticeSection />
        <ContactSection selectedService={selectedService} />
      </main>

      <Footer />
    </div>
  );
}
