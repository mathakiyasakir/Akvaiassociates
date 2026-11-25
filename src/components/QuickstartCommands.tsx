"use client";

import { useState } from "react";

interface CommandItem {
  id: string;
  label: string;
  command: string;
  note: string;
}

const COMMANDS: CommandItem[] = [
  {
    id: "dev",
    label: "Start local server",
    command: "npm run dev",
    note: "Runs Next.js on port 3000 with Fast Refresh.",
  },
  {
    id: "build",
    label: "Create production build",
    command: "npm run build",
    note: "Compiles pages, Tailwind styles, and TypeScript types.",
  },
  {
    id: "vercel",
    label: "Deploy to Vercel",
    command: "npx vercel",
    note: "Zero-config deployment directly from this directory.",
  },
];

export function QuickstartCommands() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (item: CommandItem) => {
    try {
      await navigator.clipboard.writeText(item.command);
      setCopiedId(item.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === item.id ? null : current));
      }, 1800);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
      {COMMANDS.map((item) => {
        const isCopied = copiedId === item.id;
        return (
          <div
            key={item.id}
            className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {item.label}
              </p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {item.note}
              </p>
            </div>
            <div className="flex items-center gap-3 sm:shrink-0">
              <code className="rounded-lg bg-neutral-100 px-3.5 py-2 font-mono text-sm text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
                {item.command}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(item)}
                className="min-h-10 rounded-lg border border-neutral-300 px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 text-neutral-800 transition-colors duration-150 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {isCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
