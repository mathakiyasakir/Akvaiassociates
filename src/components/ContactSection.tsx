"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

const SERVICE_OPTIONS = [
  "Architecture",
  "Interior Design",
  "Planning & Design",
  "3D Visualization",
];

interface ContactSectionProps {
  selectedService: string;
}

export function ContactSection({ selectedService }: ContactSectionProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState(selectedService || "Architecture");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (selectedService) {
      setService(selectedService);
      setSubmitted(false);
    }
  }, [selectedService]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (trimmedMessage.length < 10) {
      setError("Please share a short note about your project (at least 10 characters).");
      return;
    }

    setError(null);
    setSubmitted(true);
  };

  const mailtoHref = `mailto:hello@akvaiassociates.com?subject=${encodeURIComponent(
    `Project Enquiry — ${service}`
  )}&body=${encodeURIComponent(
    `Hello Akvai Associates,\n\nName: ${name || "[Your Name]"}\nService: ${service}\n\nProject details:\n${message || "[Tell us about your site, timeline, and goals]"}`
  )}`;

  return (
    <section id="contact" className="bg-[#1F1F1D] py-20 text-white lg:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 px-6 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#E08A3C]">
            YOUR NEXT SPACE STARTS HERE
          </p>
          <h2 className="mt-3 text-balance font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Have an idea worth building?
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#BFBDB7]">
            Tell us what you have in mind and start the conversation.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={mailtoHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[3px] bg-[#E07A22] px-6 py-3 text-sm font-medium whitespace-nowrap shrink-0 text-[#1A1918] transition-colors duration-150 hover:bg-[#CF6C18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E07A22]"
            >
              <span>Enquire by email</span>
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="border border-[#33332F] bg-[#262624] p-6 sm:p-8 lg:col-span-6">
          {submitted ? (
            <div className="py-4">
              <div className="flex items-center gap-2.5 text-[#7FD3B2]">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-semibold">Enquiry prepared</p>
              </div>
              <h3 className="mt-3 font-serif text-2xl font-semibold text-white">
                Thank you, {name.trim()}.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#BFBDB7]">
                Your project brief for <strong className="text-white">{service}</strong>{" "}
                is ready. You can open it directly in your email client or edit
                your details below.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={mailtoHref}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[3px] bg-[#E07A22] px-5 py-2.5 text-sm font-medium whitespace-nowrap text-[#1A1918] transition-colors hover:bg-[#CF6C18]"
                >
                  <span>Open in Email App</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName("");
                    setEmail("");
                    setMessage("");
                  }}
                  className="inline-flex min-h-11 items-center rounded-[3px] border border-[#494943] px-4 py-2.5 text-sm font-medium whitespace-nowrap text-[#DDDCD6] transition-colors hover:border-[#6A6A62] hover:text-white"
                >
                  Start another note
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <h3 className="font-sans text-base font-semibold text-white">
                  Share a project brief
                </h3>
                <p className="mt-1 text-xs text-[#A5A39D]">
                  Outline your site, scope, or timeline to prepare an enquiry.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="enquiry-name"
                    className="block text-xs font-medium text-[#D1CFC9]"
                  >
                    Your name
                  </label>
                  <input
                    id="enquiry-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Aarav Mehta"
                    className="mt-1.5 w-full rounded-[3px] border border-[#3E3E39] bg-[#1C1C1A] px-3.5 py-2.5 text-sm text-white placeholder:text-[#787670] focus:border-[#E07A22] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="enquiry-email"
                    className="block text-xs font-medium text-[#D1CFC9]"
                  >
                    Email address
                  </label>
                  <input
                    id="enquiry-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="mt-1.5 w-full rounded-[3px] border border-[#3E3E39] bg-[#1C1C1A] px-3.5 py-2.5 text-sm text-white placeholder:text-[#787670] focus:border-[#E07A22] focus:outline-none"
                  />
                </div>
              </div>

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
                  {SERVICE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
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
                  placeholder="Residential plot, renovation, interior scope, or 3D visualization needs..."
                  className="mt-1.5 w-full resize-none rounded-[3px] border border-[#3E3E39] bg-[#1C1C1A] px-3.5 py-2.5 text-sm text-white placeholder:text-[#787670] focus:border-[#E07A22] focus:outline-none"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-[#F59E6C]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[3px] border border-[#E07A22] bg-[#E07A22] px-5 py-2.5 text-sm font-medium text-[#1A1918] transition-colors duration-150 hover:bg-[#CF6C18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E07A22]"
              >
                Prepare Project Enquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
