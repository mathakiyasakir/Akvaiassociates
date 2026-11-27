"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import { useApp } from "@/components/AppContext";
import type { ServiceItem } from "@/lib/types";

interface ContactSectionProps {
  kicker: string;
  headline: string;
  subtitle: string;
  ctaLabel: string;
  contactEmail: string;
  services: ServiceItem[];
  selectedService: string;
}

export function ContactSection({
  kicker,
  headline,
  subtitle,
  ctaLabel,
  contactEmail,
  services,
  selectedService,
}: ContactSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const { user, authFetch, refreshOrders, setActiveTab, requireLoginOrRun } = useApp();

  const serviceTitles = services.filter((s) => s.enabled).map((s) => s.title);
  const [service, setService] = useState(
    selectedService || serviceTitles[0] || "Architecture"
  );
  const [projectType, setProjectType] = useState("Residential");
  const [location, setLocation] = useState("");
  const [budgetRange, setBudgetRange] = useState("To be discussed");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedService) {
      setService(selectedService);
      setCreatedOrderId(null);
    }
  }, [selectedService]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requireLoginOrRun(() => {})) {
      return;
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length < 8) {
      setError("Please share a short note about your project (at least 8 characters).");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await authFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          serviceTitle: service,
          projectType,
          location,
          budgetRange,
          message: trimmedMessage,
        }),
      });
      const data = (await res.json()) as { order?: { id: string }; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error || "Could not submit your enquiry. Please try again.");
        return;
      }
      setCreatedOrderId(data.order.id);
      setMessage("");
      setLocation("");
      await refreshOrders();
    } catch {
      setError("Network error while saving your enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  const mailtoHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
    `Project Enquiry — ${service}`
  )}&body=${encodeURIComponent(
    `Hello Akvai Associates,\n\nName: ${user?.name || ""}\nService: ${service}\nProject Type: ${projectType}\nLocation: ${location || "Not specified"}\n\nProject details:\n${message || "[Tell us about your site, timeline, and goals]"}`
  )}`;

  return (
    <section id="contact" className="bg-[#1F1F1D] py-20 text-white lg:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 px-6 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#E08A3C]">
            {kicker}
          </p>
          <h2 className="mt-3 text-balance font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {headline}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#BFBDB7]">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <motion.a
              href={mailtoHref}
              onClick={(event) => {
                if (!user) {
                  event.preventDefault();
                  requireLoginOrRun(() => {});
                }
              }}
              whileHover={prefersReducedMotion ? undefined : { y: -1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-6 py-3 text-sm font-medium whitespace-nowrap shrink-0 text-[#1A1918] transition-colors duration-150 hover:bg-[#CF6C18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E07A22]"
            >
              <Mail className="h-4 w-4" />
              <span>{ctaLabel}</span>
              <ArrowUpRight className="h-4 w-4" />
            </motion.a>
          </div>
        </div>

        <div className="border border-[#33332F] bg-[#262624] p-6 sm:p-8 lg:col-span-7">
          {createdOrderId ? (
            <div className="py-4">
              <div className="flex items-center gap-2.5 text-[#7FD3B2]">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="font-mono text-xs font-semibold">
                  Order saved · {createdOrderId}
                </p>
              </div>
              <h3 className="mt-3 font-serif text-2xl font-semibold text-white">
                Project brief submitted.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#BFBDB7]">
                Your request for <strong className="text-white">{service}</strong>{" "}
                has been saved to your Orders tab and received by the Akvai
                Associates studio team.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <motion.button
                  type="button"
                  onClick={() => {
                    setActiveTab("orders");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[3px] bg-[#E07A22] px-5 py-2.5 text-sm font-medium whitespace-nowrap text-[#1A1918] transition-colors hover:bg-[#CF6C18]"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>View in My Orders</span>
                </motion.button>
                <button
                  type="button"
                  onClick={() => setCreatedOrderId(null)}
                  className="inline-flex min-h-11 items-center rounded-[3px] border border-[#494943] px-4 py-2.5 text-sm font-medium whitespace-nowrap text-[#DDDCD6] transition-colors hover:border-[#6A6A62] hover:text-white"
                >
                  Submit another request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <h3 className="font-sans text-base font-semibold text-white">
                  Submit a Service Order / Brief
                </h3>
                <p className="mt-1 text-xs text-[#A5A39D]">
                  {user
                    ? `Signed in as ${user.name} (${user.email}). Submissions appear live in your Orders tab.`
                    : "Share your site, scope, or timeline to start your architectural brief."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="enquiry-service"
                    className="block text-xs font-medium text-[#D1CFC9]"
                  >
                    Service of interest
                  </label>
                  <select
                    id="enquiry-service"
                    value={service}
                    onChange={(event) => setService(event.target.value)}
                    className="mt-1.5 w-full rounded-[3px] border border-[#3E3E39] bg-[#1C1C1A] px-3.5 py-2.5 text-sm text-white focus:border-[#E07A22] focus:outline-none"
                  >
                    {serviceTitles.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="enquiry-type"
                    className="block text-xs font-medium text-[#D1CFC9]"
                  >
                    Project category
                  </label>
                  <select
                    id="enquiry-type"
                    value={projectType}
                    onChange={(event) => setProjectType(event.target.value)}
                    className="mt-1.5 w-full rounded-[3px] border border-[#3E3E39] bg-[#1C1C1A] px-3.5 py-2.5 text-sm text-white focus:border-[#E07A22] focus:outline-none"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Interior Renovation">Interior Renovation</option>
                    <option value="3D Concept Study">3D Concept Study</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="enquiry-location"
                    className="block text-xs font-medium text-[#D1CFC9]"
                  >
                    Site city / location
                  </label>
                  <input
                    id="enquiry-location"
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="e.g. Ahmedabad, Mumbai"
                    className="mt-1.5 w-full rounded-[3px] border border-[#3E3E39] bg-[#1C1C1A] px-3.5 py-2.5 text-sm text-white placeholder:text-[#787670] focus:border-[#E07A22] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="enquiry-budget"
                    className="block text-xs font-medium text-[#D1CFC9]"
                  >
                    Estimated scope
                  </label>
                  <select
                    id="enquiry-budget"
                    value={budgetRange}
                    onChange={(event) => setBudgetRange(event.target.value)}
                    className="mt-1.5 w-full rounded-[3px] border border-[#3E3E39] bg-[#1C1C1A] px-3.5 py-2.5 text-sm text-white focus:border-[#E07A22] focus:outline-none"
                  >
                    <option value="To be discussed">To be discussed</option>
                    <option value="Compact / Studio">Compact / Studio</option>
                    <option value="Full Residence">Full Residence</option>
                    <option value="Commercial / Multi-Unit">
                      Commercial / Multi-Unit
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="enquiry-message"
                  className="block text-xs font-medium text-[#D1CFC9]"
                >
                  Project overview
                </label>
                <textarea
                  id="enquiry-message"
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Share plot dimensions, design goals, or expected start date..."
                  className="mt-1.5 w-full resize-none rounded-[3px] border border-[#3E3E39] bg-[#1C1C1A] px-3.5 py-2.5 text-sm text-white placeholder:text-[#787670] focus:border-[#E07A22] focus:outline-none"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-[#F59E6C]">
                  {error}
                </p>
              )}

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[3px] border border-[#E07A22] bg-[#E07A22] px-5 py-2.5 text-sm font-medium text-[#1A1918] transition-colors duration-150 hover:bg-[#CF6C18] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E07A22]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Order...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Project Order</span>
                  </>
                )}
              </motion.button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
