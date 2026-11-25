import { HelloPlayground } from "@/components/HelloPlayground";
import { QuickstartCommands } from "@/components/QuickstartCommands";

const STACK_ITEMS = [
  {
    index: "01.",
    title: "Next.js App Router",
    description:
      "Server and Client Components structured under src/app with built-in routing, metadata API, and automatic font optimization.",
    detail: "src/app/page.tsx · src/app/layout.tsx",
  },
  {
    index: "02.",
    title: "Tailwind CSS v4",
    description:
      "Configured via @tailwindcss/postcss with @import \"tailwindcss\" and a class-based dark theme variant in globals.css.",
    detail: "src/app/globals.css · postcss.config.mjs",
  },
  {
    index: "03.",
    title: "TypeScript Strict Mode",
    description:
      "Full static type checking with @/* path aliases so components, layouts, and utilities stay cleanly typed as the project grows.",
    detail: "tsconfig.json · npm run lint",
  },
  {
    index: "04.",
    title: "Vercel Zero-Config Ready",
    description:
      "Standard Next.js build scripts and clean next.config.ts deploy directly to Vercel via Git push or the Vercel CLI.",
    detail: "next.config.ts · npx vercel",
  },
];

const PROJECT_FILES = [
  {
    path: "src/app/page.tsx",
    role: "Home page entry point — start editing your UI here.",
  },
  {
    path: "src/app/layout.tsx",
    role: "Root HTML document, Google Fonts, and page metadata.",
  },
  {
    path: "src/app/globals.css",
    role: "Tailwind CSS v4 import, theme tokens, and dark variant.",
  },
  {
    path: "next.config.ts",
    role: "Next.js and Vercel build configuration.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-neutral-50/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
          <a
            href="#overview"
            className="font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0 text-neutral-950 dark:text-white"
          >
            Akvai Associates
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400 md:flex"
          >
            <a
              href="#overview"
              className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-neutral-950 dark:hover:text-white"
            >
              Overview
            </a>
            <a
              href="#stack"
              className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-neutral-950 dark:hover:text-white"
            >
              Stack
            </a>
            <a
              href="#files"
              className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-neutral-950 dark:hover:text-white"
            >
              Project Files
            </a>
            <a
              href="#deploy"
              className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-neutral-950 dark:hover:text-white"
            >
              Deploy
            </a>
          </nav>

          <a
            href="#deploy"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium whitespace-nowrap shrink-0 text-white transition-colors duration-150 hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
          >
            Deploy Guide
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section
          id="overview"
          className="grid grid-cols-1 items-stretch gap-10 py-16 lg:grid-cols-12 lg:gap-12 lg:py-24"
        >
          <div className="flex flex-col justify-center lg:col-span-7">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Next.js App Router · Tailwind CSS v4 · Vercel Ready
            </p>
            <h1 className="mt-4 max-w-2xl text-balance font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.08] font-bold tracking-tight text-neutral-950 dark:text-white">
              Hello, World.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
              Your Next.js and Tailwind CSS workspace is set up and running.
              Edit{" "}
              <code className="rounded bg-neutral-200/70 px-1.5 py-0.5 font-mono text-sm text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
                src/app/page.tsx
              </code>{" "}
              to start building, then push to Vercel with zero extra
              configuration.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#deploy"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium whitespace-nowrap shrink-0 text-white transition-colors duration-150 hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                View Deploy Steps
              </a>
              <a
                href="#stack"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium whitespace-nowrap shrink-0 text-neutral-800 transition-colors duration-150 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
              >
                Inspect Setup
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HelloPlayground />
          </div>
        </section>

        <section
          id="stack"
          className="border-t border-neutral-200 py-16 dark:border-neutral-800 lg:py-20"
        >
          <div className="max-w-2xl">
            <h2 className="text-balance font-display text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-3xl">
              Configured Foundation
            </h2>
            <p className="mt-3 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
              Every core piece required for local development and production
              deployment on Vercel is already wired together.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-10">
            {STACK_ITEMS.map((item) => (
              <article
                key={item.index}
                className="border-t border-neutral-200 pt-6 dark:border-neutral-800"
              >
                <h3 className="font-display text-lg font-semibold text-neutral-950 dark:text-white">
                  <span className="mr-2 font-mono text-sm font-medium tabular-nums text-blue-700 dark:text-blue-400">
                    {item.index}
                  </span>
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {item.description}
                </p>
                <p className="mt-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="files"
          className="border-t border-neutral-200 py-16 dark:border-neutral-800 lg:py-20"
        >
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="text-balance font-display text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-3xl">
                Key Project Files
              </h2>
              <p className="mt-3 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                Clean App Router layout with no unused boilerplate.
              </p>
            </div>
            <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800 lg:col-span-8">
              {PROJECT_FILES.map((file) => (
                <div
                  key={file.path}
                  className="flex flex-col gap-1.5 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <code className="font-mono text-sm font-medium text-neutral-950 dark:text-white">
                    {file.path}
                  </code>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 sm:text-right">
                    {file.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="deploy"
          className="border-t border-neutral-200 py-16 dark:border-neutral-800 lg:py-20"
        >
          <div className="max-w-2xl">
            <h2 className="text-balance font-display text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-3xl">
              Run Locally &amp; Deploy to Vercel
            </h2>
            <p className="mt-3 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
              Use these commands to develop locally, verify the production
              build, or ship straight to Vercel.
            </p>
          </div>

          <div className="mt-8">
            <QuickstartCommands />
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm text-neutral-500 dark:text-neutral-400 sm:flex-row sm:items-center">
          <p className="font-medium text-neutral-900 dark:text-neutral-200">
            Akvai Associates
          </p>
          <p>Next.js App Router · Tailwind CSS v4 · Ready for Vercel</p>
        </div>
      </footer>
    </div>
  );
}
