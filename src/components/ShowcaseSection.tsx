"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, X } from "lucide-react";
import residentialVillaImg from "@/assets/images/residential_modern_villa_1795602707325.jpg";
import sereneBedroomImg from "@/assets/images/interior_serene_bedroom_1795602718756.jpg";

interface ShowcaseItem {
  id: string;
  category: string;
  title: string;
  image: StaticImageData;
  alt: string;
  studyNote: string;
  focusAreas: string;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "residential",
    category: "RESIDENTIAL INSPIRATION",
    title: "A new way to feel at home",
    image: residentialVillaImg,
    alt: "Contemporary architectural residence featuring crisp white volumes, dark timber cladding, and cantilevered glass balconies",
    studyNote:
      "Clean cantilevered planes, deep overhangs for natural shading, and generous corner glazing connect living volumes directly to sky and landscape.",
    focusAreas: "Massing · Cantilevered Balconies · Natural Shading",
  },
  {
    id: "interior",
    category: "INTERIOR INSPIRATION",
    title: "Spaces with room to breathe",
    image: sereneBedroomImg,
    alt: "Sunlit minimalist bedroom interior with warm oak wood flooring, textured linen bedding, woven wooden screen, and indoor greenery",
    studyNote:
      "Tactile natural timber, breathable linen surfaces, and calibrated afternoon daylight create a calm domestic rhythm without visual noise.",
    focusAreas: "Daylighting · Material Honesty · Calm Proportion",
  },
];

export function ShowcaseSection() {
  const prefersReducedMotion = useReducedMotion();
  const [activeItem, setActiveItem] = useState<ShowcaseItem | null>(null);

  useEffect(() => {
    if (!activeItem) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveItem(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeItem]);

  return (
    <section
      id="showcase"
      className="border-t border-[#DCE0D8] bg-[#E9ECE6] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
            DESIGN IN PERSPECTIVE
          </p>
          <h2 className="mt-3 text-balance font-serif text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-4xl">
            A closer look at possibility.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#555650]">
            Visual references to the forms, textures, and spaces that inspire
            our practice.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {SHOWCASE_ITEMS.map((item, index) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => setActiveItem(item)}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.45,
                delay: prefersReducedMotion ? 0 : index * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group flex flex-col overflow-hidden border border-[#DCDFD7] bg-white text-left transition-colors duration-150 hover:border-[#BEC4B8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#D9DDD5]">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  referrerPolicy="no-referrer"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </div>

              <div className="flex items-end justify-between gap-4 p-6 sm:p-7">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-[#0D5C43]">
                    {item.category}
                  </p>
                  <h3 className="mt-2 font-sans text-xl font-semibold tracking-tight text-[#1C1B19]">
                    {item.title}
                  </h3>
                </div>
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] border border-[#E4E0D7] text-[#4C4B47] transition-colors duration-150 group-hover:border-[#0D5C43] group-hover:text-[#0D5C43]"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-[#676961]">
          Imagery shown is design inspiration, not a portfolio of completed
          Akvai projects.
        </p>
      </div>

      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
          onClick={() => setActiveItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141513]/80 p-4 backdrop-blur-xs sm:p-6"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-3xl overflow-hidden border border-[#343632] bg-white shadow-2xl"
          >
            <div className="relative aspect-[4/3] w-full bg-[#D9DDD5]">
              <Image
                src={activeItem.image}
                alt={activeItem.alt}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                referrerPolicy="no-referrer"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                aria-label="Close reference preview"
                className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-[3px] bg-white/95 text-[#1C1B19] shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#0D5C43]">
                {activeItem.category}
              </p>
              <h3 className="mt-2 font-serif text-2xl font-bold text-[#1C1B19]">
                {activeItem.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#55534E] sm:text-base">
                {activeItem.studyNote}
              </p>
              <p className="mt-5 border-t border-[#EAE6DE] pt-4 text-xs font-medium text-[#6B6963]">
                {activeItem.focusAreas}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
