import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { AppProvider } from "@/components/AppContext";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  title: "Akvai Associates — Architectural Practice",
  description:
    "Thoughtful architecture from the first sketch to the final detail. Residential and commercial architecture, interior design, space planning, and 3D visualization.",
  openGraph: {
    title: "Akvai Associates — Architectural Practice",
    description:
      "Spaces shaped for the way you live. Architecture, interior design, planning, and 3D visualization by Akvai Associates.",
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
      className={`${playfairDisplay.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#F4F1EA] text-[#1C1B19] antialiased selection:bg-[#0D5C43] selection:text-white">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
