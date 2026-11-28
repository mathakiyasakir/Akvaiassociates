"use client";

import { motion, useReducedMotion } from "motion/react";
import { ClipboardList, Home, Layers, User } from "lucide-react";
import { useApp, type AppTab } from "@/components/AppContext";

interface BottomNavItem {
  id: AppTab;
  label: string;
  icon: typeof Home;
  requiresAuth: boolean;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: "home", label: "Home", icon: Home, requiresAuth: false },
  { id: "service", label: "Service", icon: Layers, requiresAuth: false },
  { id: "orders", label: "Orders", icon: ClipboardList, requiresAuth: true },
  { id: "profile", label: "Profile", icon: User, requiresAuth: true },
];

export function BottomNav() {
  const prefersReducedMotion = useReducedMotion();
  const { user, activeTab, setActiveTab, orders, requireLoginOrRun } = useApp();

  const handleSelect = (item: BottomNavItem) => {
    if (!item.requiresAuth) {
      setActiveTab(item.id);
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
      return;
    }

    requireLoginOrRun(() => {
      setActiveTab(item.id);
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }, item.id);
  };

  return (
    <nav
      aria-label="Footer navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E1D8] bg-white/95 shadow-[0_-6px_24px_-14px_rgba(24,28,26,0.18)] backdrop-blur-md"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-4 gap-2 px-3 py-2 sm:px-6">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[8px] px-3 py-1.5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43] ${
                isActive
                  ? "text-[#0D5C43]"
                  : "text-[#585651] hover:bg-[#F5F2EB] hover:text-[#1C1B19]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="stickyFooterNavPill"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[8px] bg-[#E5EFEA]"
                />
              )}

              <span className="relative z-10 flex items-center justify-center">
                <Icon
                  className="h-[19px] w-[19px]"
                  strokeWidth={isActive ? 2.1 : 1.75}
                />
                {user && item.id === "orders" && orders.length > 0 && (
                  <span className="ml-1 font-mono text-[10px] font-semibold tabular-nums text-[#DF7324]">
                    ({orders.length})
                  </span>
                )}
              </span>
              <span className="relative z-10 text-[11px] font-medium whitespace-nowrap">
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
