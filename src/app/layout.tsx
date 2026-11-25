import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Akvai Associates — Hello World",
  description:
    "Hello World starter built with Next.js App Router, Tailwind CSS v4, and TypeScript, configured for zero-config Vercel deployment.",
  openGraph: {
    title: "Akvai Associates — Hello World",
    description:
      "Hello World starter built with Next.js App Router, Tailwind CSS v4, and TypeScript, configured for zero-config Vercel deployment.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased selection:bg-blue-700 selection:text-white dark:bg-neutral-950 dark:text-neutral-100">
        {children}
      </body>
    </html>
  );
}
