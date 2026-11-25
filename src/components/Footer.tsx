export function Footer() {
  return (
    <footer className="border-t border-[#2B2B28] bg-[#141413] text-[#C2C0BA]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-white">
              AKVAI ASSOCIATES
            </p>
            <p className="mt-2 text-sm text-[#9B9993]">
              Architecture with intention.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs font-semibold tracking-[0.08em] text-white">
              Explore
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm md:flex-col md:gap-y-2.5">
              <li>
                <a
                  href="#services"
                  className="text-[#B5B3AD] transition-colors hover:text-white"
                >
                  Services
                </a>
              </li>
              <li>
                <a
                  href="#showcase"
                  className="text-[#B5B3AD] transition-colors hover:text-white"
                >
                  Showcase
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="text-[#B5B3AD] transition-colors hover:text-white"
                >
                  About
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="text-xs font-semibold tracking-[0.08em] text-white">
              Get in touch
            </p>
            <a
              href="mailto:hello@akvaiassociates.com"
              className="mt-3 inline-block text-sm font-medium text-white underline-offset-4 hover:underline"
            >
              hello@akvaiassociates.com
            </a>
            <p className="mt-2 text-xs leading-relaxed text-[#85837D]">
              Example contact address — replace with your verified business
              email before publishing.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-[#262623] pt-6 text-xs text-[#85837D]">
          <p>© 2026 Akvai Associates. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
