"use client";

import { useApp } from "@/components/AppContext";

export function Footer() {
  const { user, siteConfig, setActiveTab, requireLoginOrRun } = useApp();
  const { brand } = siteConfig;

  const jumpTo = (href: string) => {
    requireLoginOrRun(() => {
      setActiveTab("home");
      window.setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }, 60);
    });
  };

  return (
    <footer className="border-t border-[#2B2B28] bg-[#141413] pb-24 text-[#C2C0BA]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-white">
              {brand.name}
            </p>
            <p className="mt-2 text-sm text-[#9B9993]">{brand.tagline}</p>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs font-semibold tracking-[0.08em] text-white">
              Explore
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm md:flex-col md:gap-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => jumpTo("#services")}
                  className="text-[#B5B3AD] transition-colors hover:text-white"
                >
                  Services
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => jumpTo("#showcase")}
                  className="text-[#B5B3AD] transition-colors hover:text-white"
                >
                  Showcase
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => jumpTo("#about")}
                  className="text-[#B5B3AD] transition-colors hover:text-white"
                >
                  About
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="text-xs font-semibold tracking-[0.08em] text-white">
              Get in touch
            </p>
            <a
              href={`mailto:${brand.contactEmail}`}
              onClick={(event) => {
                if (!user) {
                  event.preventDefault();
                  requireLoginOrRun(() => {});
                }
              }}
              className="mt-3 inline-block text-sm font-medium text-white underline-offset-4 hover:underline"
            >
              {brand.contactEmail}
            </a>
            <p className="mt-2 text-xs leading-relaxed text-[#85837D]">
              {brand.emailNotice}
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-[#262623] pt-6 text-xs text-[#85837D]">
          <p>{brand.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
