"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardPlus,
  Clock,
  Loader2,
  Send,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppContext";
import { ServiceIcon } from "@/components/ServiceIcon";
import type { ServiceItem } from "@/lib/types";

export function ServiceTabView() {
  const prefersReducedMotion = useReducedMotion();
  const { siteConfig, authFetch, refreshOrders, setActiveTab } = useApp();

  const visibleServices = siteConfig.services.filter((s) => s.enabled);
  const [bookingService, setBookingService] = useState<ServiceItem | null>(null);
  const [projectType, setProjectType] = useState("Residential");
  const [location, setLocation] = useState("");
  const [budgetRange, setBudgetRange] = useState("Full Residence");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleBookSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bookingService) return;
    if (message.trim().length < 8) {
      setError("Please add at least 8 characters describing your project.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await authFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          serviceTitle: bookingService.title,
          projectType,
          location,
          budgetRange,
          message: message.trim(),
        }),
      });
      const data = (await res.json()) as { order?: { id: string }; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error || "Could not submit your service order.");
        return;
      }
      setSuccessId(data.order.id);
      setMessage("");
      setLocation("");
      await refreshOrders();
    } catch {
      setError("Network error while creating your order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-144px)] bg-[#F4F1EA] pb-28">
      <section className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#0D5C43]">
            {siteConfig.servicesSection.kicker}
          </p>
          <h1 className="mt-3 text-balance font-serif text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-5xl">
            {siteConfig.servicesSection.headline}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#575550]">
            {siteConfig.servicesSection.subtitle} Select any architectural
            discipline below to review deliverables and place a project order.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {visibleServices.map((service, idx) => (
            <motion.article
              key={service.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="flex flex-col justify-between border border-[#E4E0D7] bg-white p-7 sm:p-8"
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs font-medium tabular-nums text-[#0D5C43]">
                    {service.number}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#65635D]">
                    <Clock className="h-3.5 w-3.5 text-[#0D5C43]" />
                    <span>{service.timeline}</span>
                  </span>
                </div>

                <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-[4px] bg-[#E5EFEA]">
                  <ServiceIcon icon={service.icon} className="h-5 w-5 text-[#0D5C43]" />
                </div>

                <h2 className="mt-5 font-sans text-xl font-semibold text-[#1C1B19]">
                  {service.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#585651]">
                  {service.description}
                </p>

                <ul className="mt-5 space-y-2 border-t border-[#F0ECE4] pt-4 text-sm text-[#464541]">
                  {service.deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1 w-3 shrink-0 bg-[#DF7324]"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-7 pt-2">
                <motion.button
                  type="button"
                  onClick={() => {
                    setBookingService(service);
                    setError(null);
                    setSuccessId(null);
                  }}
                  whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-5 py-2.5 text-sm font-medium text-[#1A1918] transition-colors hover:bg-[#CF6C18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C43]"
                >
                  <ClipboardPlus className="h-4 w-4" />
                  <span>Request {service.title}</span>
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Visual Service Order Drawer Modal */}
      {bookingService && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Request ${bookingService.title}`}
          onClick={() => setBookingService(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141513]/75 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg border border-[#DCD8CE] bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#ECE8E0] pb-4">
              <div>
                <p className="font-mono text-xs font-medium text-[#0D5C43]">
                  {bookingService.number} SERVICE ORDER
                </p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-[#1C1B19]">
                  {bookingService.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBookingService(null)}
                aria-label="Close service booking"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[3px] text-[#55534E] hover:bg-[#F4F1EA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {successId ? (
              <div className="py-6">
                <div className="flex items-center gap-2 text-[#0D5C43]">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-mono text-xs font-semibold">
                    Order Confirmed · {successId}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#55534E]">
                  Your architectural request for{" "}
                  <strong className="text-[#1C1B19]">{bookingService.title}</strong>{" "}
                  is now live in your Orders dashboard.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingService(null);
                      setActiveTab("orders");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-[3px] bg-[#0D5C43] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0A4A36]"
                  >
                    <span>Go to My Orders</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingService(null)}
                    className="inline-flex min-h-11 items-center rounded-[3px] border border-[#D4CFC4] px-4 py-2.5 text-sm font-medium text-[#1C1B19] hover:bg-[#F4F1EA]"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="book-type"
                      className="block text-xs font-semibold text-[#3C3B37]"
                    >
                      Project Type
                    </label>
                    <select
                      id="book-type"
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2.5 text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                    >
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Interior Renovation">Interior Renovation</option>
                      <option value="3D Concept Study">3D Concept Study</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="book-budget"
                      className="block text-xs font-semibold text-[#3C3B37]"
                    >
                      Project Scale
                    </label>
                    <select
                      id="book-budget"
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3 py-2.5 text-sm text-[#1C1B19] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                    >
                      <option value="Compact / Studio">Compact / Studio</option>
                      <option value="Full Residence">Full Residence</option>
                      <option value="Commercial / Multi-Unit">
                        Commercial / Multi-Unit
                      </option>
                      <option value="To be discussed">To be discussed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="book-location"
                    className="block text-xs font-semibold text-[#3C3B37]"
                  >
                    Site Location
                  </label>
                  <input
                    id="book-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City or site address"
                    className="mt-1.5 w-full rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm text-[#1C1B19] placeholder:text-[#8E8C85] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="book-message"
                    className="block text-xs font-semibold text-[#3C3B37]"
                  >
                    Project Requirements
                  </label>
                  <textarea
                    id="book-message"
                    rows={3}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your space, plot size, or design vision..."
                    className="mt-1.5 w-full resize-none rounded-[3px] border border-[#D8D3C8] bg-[#FAF9F5] px-3.5 py-2.5 text-sm text-[#1C1B19] placeholder:text-[#8E8C85] focus:border-[#0D5C43] focus:bg-white focus:outline-none"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-xs font-medium text-[#9A3412]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-5 py-2.5 text-sm font-semibold text-[#1A1918] transition-colors hover:bg-[#CF6C18] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting Order...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Confirm Service Request</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
