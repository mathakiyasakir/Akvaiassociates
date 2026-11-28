"use client";

import Image from "next/image";
import akvaiLogo from "../../public/images/akvai-logo.png";
import { useApp } from "@/components/AppContext";

interface BrandLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function BrandLogo({
  className = "h-12 w-auto object-contain",
  width = 92,
  height = 60,
  priority = true,
}: BrandLogoProps) {
  const { siteConfig } = useApp();
  const customLogo = siteConfig.brand.logoDataUrl;
  const altText = siteConfig.brand.name || "Akvai Associates";

  if (customLogo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={customLogo}
        alt={altText}
        className={className}
      />
    );
  }

  return (
    <Image
      src={akvaiLogo}
      alt={altText}
      width={width}
      height={height}
      priority={priority}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
}
