"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Compass } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { ArchitecturalHeroModel } from "@/components/ArchitecturalHeroModel";
import { ServicesSection } from "@/components/ServicesSection";
import { ShowcaseSection } from "@/components/ShowcaseSection";
import { PracticeSection } from "@/components/PracticeSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { ServiceTabView } from "@/components/ServiceTabView";
import { OrdersTabView } from "@/components/OrdersTabView";
import { ProfileTabView } from "@/components/ProfileTabView";

export function AkvaiHomeShell() {
  const prefersReducedMotion = useReducedMotion();
  const { user, activeTab, setActiveTab, siteConfig, requireLoginOrRun } = useApp();
  const [selectedService, setSelectedService] = useState("Architecture");

  const currentTab = user ? activeTab : "home";

  const scrollToSection = (selector: string) => {
    const el = document.querySelector(selector);
    el?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  const {
    hero,
    servicesSection,
    services,
    showcaseSection,
    showcase,
    practice,
    contact,
    brand,
  } = siteConfig;

  return (
    <div id="top" className="min-h-screen bg-[#F4F1EA] text-[#1C1B19]">
      <Navbar />

      {currentTab === "home" && (
        <>
          <main>
            <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pt-12 pb-16 lg:grid-cols-12 lg:gap-12 lg:pt-20 lg:pb-24">
              <div className="lg:col-span-6">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
                  <span>{hero.kickerLeft}</span>
                  <span aria-hidden="true" className="mx-2 text-[#8EA69B]">
                    /
                  </span>
                  <span>{hero.kickerRight}</span>
                </p>

                <h1 className="mt-4 max-w-xl text-balance font-serif text-[clamp(2.35rem,4.6vw,3.9rem)] leading-[1.1] font-bold tracking-tight text-[#1C1B19]">
                  {hero.headline}
                </h1>

                <p className="mt-5 max-w-lg text-base leading-relaxed text-[#575550] sm:text-lg">
                  {hero.subheading}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3.5">
                  <motion.a
                    href="#services"
                    onClick={(event) => {
                      event.preventDefault();
                      requireLoginOrRun(() => scrollToSection("#services"));
                    }}
                    whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-6 py-3 text-sm font-medium whitespace-nowrap shrink-0 text-[#1A1918] shadow-xs transition-colors duration-150 hover:bg-[#CF6C18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43]"
                  >
                    <span>{hero.primaryCta}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </motion.a>
                  <motion.a
                    href="#about"
                    onClick={(event) => {
                      event.preventDefault();
                      requireLoginOrRun(() => scrollToSection("#about"));
                    }}
                    whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[3px] border border-[#2C2B28] bg-transparent px-6 py-3 text-sm font-medium whitespace-nowrap shrink-0 text-[#1C1B19] transition-colors duration-150 hover:bg-[#E9E5DB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43]"
                  >
                    <Compass className="h-4 w-4 text-[#0D5C43]" />
                    <span>{hero.secondaryCta}</span>
                  </motion.a>
                </div>

                <div className="mt-8 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-[1.5px] w-9 shrink-0 bg-[#DF7324]"
                  />
                  <p className="text-xs font-medium text-[#64625C]">
                    {hero.footnote}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6">
                <ArchitecturalHeroModel
                  mottoLeft={hero.modelMottoLeft}
                  mottoCenter={hero.modelMottoCenter}
                  mottoRight={hero.modelMottoRight}
                />
              </div>
            </section>

            <ServicesSection
              kicker={servicesSection.kicker}
              headline={servicesSection.headline}
              subtitle={servicesSection.subtitle}
              services={services}
              onSelectService={setSelectedService}
              onOpenServiceTab={() => {
                requireLoginOrRun(() => {
                  setActiveTab("service");
                  window.scrollTo({
                    top: 0,
                    behavior: prefersReducedMotion ? "auto" : "smooth",
                  });
                }, "service");
              }}
            />

            <ShowcaseSection
              kicker={showcaseSection.kicker}
              headline={showcaseSection.headline}
              subtitle={showcaseSection.subtitle}
              disclaimer={showcaseSection.disclaimer}
              items={showcase}
            />

            <PracticeSection
              kicker={practice.kicker}
              headline={practice.headline}
              paragraph1={practice.paragraph1}
              paragraph2={practice.paragraph2}
              visualCaption={practice.visualCaption}
              disciplines={practice.disciplines}
            />

            <ContactSection
              kicker={contact.kicker}
              headline={contact.headline}
              subtitle={contact.subtitle}
              ctaLabel={contact.ctaLabel}
              contactEmail={brand.contactEmail}
              services={services}
              selectedService={selectedService}
            />
          </main>

          <Footer />
        </>
      )}

      {user && currentTab === "service" && <ServiceTabView />}
      {user && currentTab === "orders" && <OrdersTabView />}
      {user && currentTab === "profile" && <ProfileTabView />}

      <BottomNav />
    </div>
  );
}
