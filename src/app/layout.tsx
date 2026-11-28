import type { Metadata } from "next";
import { AppProvider } from "@/components/AppContext";
import "./globals.css";

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Playfair+Display:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F4F1EA] text-[#1C1B19] antialiased selection:bg-[#0D5C43] selection:text-white">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
