"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const WINDOWS = Array.from({ length: 9 }, (_, i) => i);

interface ArchitecturalHeroModelProps {
  mottoLeft: string;
  mottoCenter: string;
  mottoRight: string;
}

export function ArchitecturalHeroModel({
  mottoLeft,
  mottoCenter,
  mottoRight,
}: ArchitecturalHeroModelProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 4, rotateY: -10 });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rotateX: 4 - y * 10,
      rotateY: -10 + x * 14,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rotateX: 4, rotateY: -10 });
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative mx-auto flex min-h-[370px] w-full max-w-[540px] items-center justify-center overflow-visible py-8 select-none sm:min-h-[430px] lg:min-h-[470px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-6 bottom-8 overflow-hidden"
      >
        <div
          className="h-full w-full opacity-55"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(13, 92, 67, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(13, 92, 67, 0.08) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            transform: "perspective(800px) rotateX(18deg) skewX(-12deg) scale(1.04)",
          }}
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-1/2 h-16 w-[84%] -translate-x-1/2 rounded-full bg-[#3A433D]/18 blur-2xl"
      />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
        animate={{
          opacity: 1,
          y: 0,
          rotateX: prefersReducedMotion ? 4 : tilt.rotateX,
          rotateY: prefersReducedMotion ? -10 : tilt.rotateY,
        }}
        transition={{
          opacity: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
          y: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
          rotateX: { type: "spring", stiffness: 160, damping: 24 },
          rotateY: { type: "spring", stiffness: 160, damping: 24 },
        }}
        style={{
          perspective: 1200,
          transformStyle: "preserve-3d",
        }}
        className="relative h-[300px] w-[300px] sm:h-[345px] sm:w-[355px]"
      >
        <div
          aria-hidden="true"
          className="absolute right-3 bottom-3 left-2 h-10 rounded-[2px] border border-[#D4D1C7] bg-gradient-to-r from-[#E4E0D6] via-[#ECE9E0] to-[#DAD6CB] shadow-[0_22px_40px_-14px_rgba(28,36,32,0.28)]"
          style={{
            transform: "skewX(-28deg) rotate(-5deg) translateZ(-18px)",
          }}
        />

        <div
          aria-hidden="true"
          className="absolute top-3 right-8 bottom-12 left-10 bg-[#0D5C43]/14"
          style={{
            transform: "translate3d(18px, -10px, -24px) rotate(-6deg) skewY(-2deg)",
          }}
        />

        <div
          aria-hidden="true"
          className="absolute top-5 right-[42px] bottom-[44px] w-[48px] bg-gradient-to-b from-[#3E554C] via-[#31463E] to-[#243630] shadow-xl sm:right-[48px] sm:w-[54px]"
          style={{
            transform: "skewY(14deg) rotate(-5deg) translateZ(-4px)",
          }}
        />

        <div
          className="absolute top-4 right-[78px] bottom-[38px] left-[38px] border border-[#CAD1C8] bg-gradient-to-br from-[#ECEFE9] via-[#DCE2DA] to-[#C8D0C6] p-5 shadow-[12px_20px_38px_-12px_rgba(24,34,30,0.26)] sm:right-[88px] sm:left-[44px] sm:p-6"
          style={{
            transform: "rotate(-5.5deg) skewY(-2deg) translateZ(18px)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-[5px] bg-white/75" />
          <div className="absolute inset-y-0 left-0 w-[4px] bg-white/55" />

          <div className="grid h-full grid-cols-3 grid-rows-3 gap-3 sm:gap-3.5">
            {WINDOWS.map((idx) => (
              <div
                key={idx}
                className="relative overflow-hidden border-t-[3px] border-l-[3px] border-[#9AA69E] bg-gradient-to-br from-[#6F8880] via-[#4D665E] to-[#2F463F] shadow-[inset_0_2px_6px_rgba(12,24,20,0.45)]"
              >
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/18 to-white/35"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 42% 100%, 0 100%)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#E8ECE6]/80" />
              </div>
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute bottom-[30px] left-[16px] h-[54px] w-[62px] border border-[#D4D0C6] bg-gradient-to-br from-[#EFECE4] to-[#DCD7CC] shadow-md sm:h-[62px] sm:w-[70px]"
          style={{
            transform: "rotate(-5.5deg) translateZ(26px)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-[3px] bg-white/70" />
        </div>

        <div
          aria-hidden="true"
          className="absolute right-[14px] bottom-[28px] h-[116px] w-[76px] sm:right-[18px] sm:h-[132px] sm:w-[86px]"
          style={{
            transform: "rotate(-5.5deg) translateZ(34px)",
          }}
        >
          <div className="relative h-full w-[54px] bg-gradient-to-b from-[#E58129] via-[#DC731D] to-[#C66113] shadow-[8px_14px_26px_-8px_rgba(130,58,8,0.42)] sm:w-[62px]">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-[#F4A65E]/80" />
            <div className="absolute inset-y-0 left-0 w-[3px] bg-[#F29C4D]/65" />
          </div>
          <div
            className="absolute top-[5px] right-0 bottom-[-5px] w-[22px] bg-gradient-to-b from-[#B75911] to-[#94450A] sm:w-[24px]"
            style={{ transform: "skewY(18deg)" }}
          />
        </div>
      </motion.div>

      <div className="absolute right-2 bottom-4 z-10 border border-[#E5E1D8] bg-white px-4 py-2.5 shadow-[0_12px_28px_-10px_rgba(24,28,26,0.18)] sm:right-6 sm:bottom-6">
        <p className="text-[11px] tracking-[0.14em] whitespace-nowrap text-[#55534E]">
          <span>{mottoLeft}</span>
          <span aria-hidden="true" className="mx-1.5 text-[#C0BCB2]">
            /
          </span>
          <span className="font-semibold text-[#1C1B19]">{mottoCenter}</span>
          <span aria-hidden="true" className="mx-1.5 text-[#C0BCB2]">
            /
          </span>
          <span>{mottoRight}</span>
        </p>
      </div>
    </div>
  );
}
