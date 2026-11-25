"use client";

import { useEffect, useState } from "react";

export function HelloPlayground() {
  const [name, setName] = useState("World");
  const [count, setCount] = useState(0);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  const greetingTarget = name.trim() || "World";

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
      <div>
        <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Interactive Preview · Client Component
          </p>
          <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
            <button
              type="button"
              onClick={() => setIsDark(false)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                !isDark
                  ? "bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setIsDark(true)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                isDark
                  ? "bg-white text-neutral-900 shadow-xs dark:bg-neutral-950 dark:text-white"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        <div className="mt-8">
          <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            Rendered Output
          </p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
            Hello, {greetingTarget}!
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Type below to verify live React state and Tailwind CSS styling on
            this page.
          </p>
        </div>

        <div className="mt-6">
          <label
            htmlFor="greeting-name"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Greeting Name
          </label>
          <input
            id="greeting-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="World"
            maxLength={32}
            className="mt-2 w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 transition-colors duration-150 placeholder:text-neutral-400 focus:border-blue-700 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-blue-500 dark:focus:bg-neutral-900"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-5 dark:border-neutral-800">
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            State Counter
          </p>
          <p className="font-mono text-xl font-medium tabular-nums text-neutral-950 dark:text-white">
            {count}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCount(0)}
            disabled={count === 0}
            className="min-h-10 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium whitespace-nowrap shrink-0 text-neutral-700 transition-colors duration-150 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setCount((prev) => prev + 1)}
            className="min-h-10 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium whitespace-nowrap shrink-0 text-white transition-colors duration-150 hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            Increment
          </button>
        </div>
      </div>
    </div>
  );
}
