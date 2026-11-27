import {
  Box,
  Building2,
  Compass,
  Home,
  Layers,
  LayoutGrid,
  PenTool,
  Ruler,
} from "lucide-react";
import type { ServiceIconKey } from "@/lib/types";

export function ServiceIcon({
  icon,
  className = "h-5 w-5 text-[#0D5C43]",
}: {
  icon: ServiceIconKey;
  className?: string;
}) {
  switch (icon) {
    case "building":
      return <Building2 className={className} strokeWidth={1.75} />;
    case "grid":
      return <LayoutGrid className={className} strokeWidth={1.75} />;
    case "ruler":
      return <Ruler className={className} strokeWidth={1.75} />;
    case "box":
      return <Box className={className} strokeWidth={1.75} />;
    case "compass":
      return <Compass className={className} strokeWidth={1.75} />;
    case "layers":
      return <Layers className={className} strokeWidth={1.75} />;
    case "pentool":
      return <PenTool className={className} strokeWidth={1.75} />;
    case "home":
      return <Home className={className} strokeWidth={1.75} />;
  }
}
