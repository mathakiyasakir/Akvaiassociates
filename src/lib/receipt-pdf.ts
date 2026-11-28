"use client";

import { jsPDF } from "jspdf";
import type { OrderItem, SiteConfig } from "@/lib/types";

function formatInrForPdf(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `Rs. ${safe.toLocaleString("en-IN")}.00`;
}

function formatDateReadable(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function detectImageFormat(dataUrl: string): "PNG" | "JPEG" | "WEBP" {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    return "JPEG";
  }
  if (dataUrl.startsWith("data:image/webp")) {
    return "WEBP";
  }
  return "PNG";
}

async function loadDefaultLogoDataUrl(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/images/akvai-logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Logo read failed"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function getImageNaturalSize(
  dataUrl: string
): Promise<{ width: number; height: number } | null> {
  if (typeof window === "undefined") return null;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () =>
      resolve({
        width: img.naturalWidth || 400,
        height: img.naturalHeight || 200,
      });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function drawDynamicDetailsBlock(
  doc: jsPDF,
  order: OrderItem,
  siteConfig: SiteConfig,
  startY: number,
  style: "architectural" | "minimal" | "custom-template"
) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = startY;

  const primaryRgb: [number, number, number] =
    style === "minimal" ? [28, 27, 25] : [13, 92, 67];
  const accentRgb: [number, number, number] = [223, 115, 36];

  if (style === "custom-template") {
    // Translucent crisp card so owner's uploaded receipt template remains visible around it
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(215, 210, 200);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin - 2, y - 5, contentW + 4, 152, 2, 2, "FD");
  }

  // Invoice & Client two-column metadata box
  doc.setFillColor(248, 246, 241);
  doc.setDrawColor(228, 224, 215);
  doc.setLineWidth(0.35);
  doc.rect(margin, y, contentW, 34, "FD");

  // Left: Billed To (Dynamic Client Name & Email)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...primaryRgb);
  doc.text("BILLED TO (CLIENT)", margin + 5, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(28, 27, 25);
  doc.text(order.userName || "Valued Client", margin + 5, y + 14.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(88, 86, 81);
  doc.text(order.userEmail || "", margin + 5, y + 20.5);
  if (order.location && order.location !== "Not specified") {
    doc.text(`Site Location: ${order.location.slice(0, 48)}`, margin + 5, y + 26.5);
  }

  // Right: Receipt Metadata
  const rightColX = margin + contentW - 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...primaryRgb);
  doc.text("RECEIPT DETAILS", rightColX, y + 7, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(28, 27, 25);
  doc.text(`Invoice: ${order.invoiceNumber}`, rightColX, y + 14, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(88, 86, 81);
  doc.text(`Order ID: ${order.id}`, rightColX, y + 20, { align: "right" });
  doc.text(`Date: ${formatDateReadable(order.createdAt)}`, rightColX, y + 25.5, {
    align: "right",
  });
  doc.text(
    `Status: ${order.payment.status.toUpperCase()}`,
    rightColX,
    y + 30.8,
    { align: "right" }
  );

  y += 42;

  // Service Line Item Table Header
  doc.setFillColor(...primaryRgb);
  doc.rect(margin, y, contentW, 9.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("ARCHITECTURAL SERVICE & SCOPE", margin + 4, y + 6.3);
  doc.text("CATEGORY", margin + contentW * 0.58, y + 6.3);
  doc.text("AMOUNT (INR)", rightColX - 2, y + 6.3, { align: "right" });

  y += 9.5;

  // Service Line Item Row
  const rowH = order.plotDetails ? 32 : 22;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(228, 224, 215);
  doc.rect(margin, y, contentW, rowH, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(28, 27, 25);
  doc.text(order.serviceTitle.slice(0, 52), margin + 4, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(92, 90, 85);
  const shortBrief = order.message.replace(/\s+/g, " ").slice(0, 74);
  doc.text(
    shortBrief + (order.message.length > 74 ? "..." : ""),
    margin + 4,
    y + 14.2
  );

  if (order.plotDetails) {
    const p = order.plotDetails;
    const dimText =
      p.length && p.width
        ? `Plot: ${p.length} x ${p.width} ${p.unit}${p.areaSq ? ` (${p.areaSq})` : ""} | North: ${p.northSide} | Floors: ${p.floors}`
        : `North Facing: ${p.northSide} | Floors: ${p.floors}`;
    doc.setTextColor(...primaryRgb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(dimText.slice(0, 82), margin + 4, y + 22);
    if (p.sketchFileName) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 98, 92);
      doc.text(`Client Sketch Attached: ${p.sketchFileName}`, margin + 4, y + 27.5);
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(55, 54, 50);
  doc.text(order.projectType.slice(0, 22), margin + contentW * 0.58, y + 8.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(28, 27, 25);
  doc.text(formatInrForPdf(order.payment.amountInr), rightColX - 2, y + 8.5, {
    align: "right",
  });

  y += rowH + 6;

  // Payment Summary & Total Band
  doc.setFillColor(244, 241, 234);
  doc.setDrawColor(218, 212, 200);
  doc.rect(margin, y, contentW, 24, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...primaryRgb);
  doc.text("PAYMENT INFORMATION", margin + 5, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(55, 54, 50);
  doc.text(`Method: ${order.payment.method}`, margin + 5, y + 13.5);
  doc.text(
    `Reference / UTR: ${order.payment.referenceId || "Recorded"}`,
    margin + 5,
    y + 19.5
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(88, 86, 81);
  doc.text("TOTAL AMOUNT", rightColX - 4, y + 8, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...accentRgb);
  doc.text(formatInrForPdf(order.payment.amountInr), rightColX - 4, y + 18, {
    align: "right",
  });

  y += 32;

  // Signatory & Studio Footer
  doc.setDrawColor(220, 216, 206);
  doc.line(margin, y, margin + contentW, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(92, 90, 85);
  const footerLines = doc.splitTextToSize(
    siteConfig.billing.footerNote ||
      "Thank you for choosing Akvai Associates.",
    contentW * 0.62
  );
  doc.text(footerLines, margin, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(28, 27, 25);
  doc.text(siteConfig.billing.signatoryName || siteConfig.brand.name, rightColX, y + 2, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(110, 108, 102);
  doc.text("Authorized Digital Receipt", rightColX, y + 7, { align: "right" });
}

export async function downloadOrderReceiptPdf(
  order: OrderItem,
  siteConfig: SiteConfig
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;

  const style = siteConfig.billing.receiptStyle || "architectural";
  const hasCustomTemplate =
    style === "custom-template" &&
    Boolean(siteConfig.billing.templateImageDataUrl);

  if (hasCustomTemplate && siteConfig.billing.templateImageDataUrl) {
    // Draw owner's uploaded custom receipt template cleanly preserving aspect ratio
    try {
      const tpl = siteConfig.billing.templateImageDataUrl;
      const fmt = detectImageFormat(tpl);
      doc.addImage(tpl, fmt, 0, 0, pageW, pageH, undefined, "FAST");
    } catch {
      // Fallback to crisp paper fill if image encoding fails
      doc.setFillColor(250, 249, 245);
      doc.rect(0, 0, pageW, pageH, "F");
    }

    // Place dynamic client/service receipt details cleanly over the body area
    drawDynamicDetailsBlock(doc, order, siteConfig, 94, "custom-template");
  } else {
    // Standard Architectural or Minimal Letterhead
    const isMinimal = style === "minimal";

    // Top accent bar
    doc.setFillColor(isMinimal ? 28 : 13, isMinimal ? 27 : 92, isMinimal ? 25 : 67);
    doc.rect(0, 0, pageW, 5, "F");
    if (!isMinimal) {
      doc.setFillColor(224, 122, 34);
      doc.rect(0, 5, pageW, 1.4, "F");
    }

    // Header band
    doc.setFillColor(isMinimal ? 255 : 244, isMinimal ? 255 : 241, isMinimal ? 255 : 234);
    doc.rect(0, 6.4, pageW, 42, "F");

    // Brand Logo (custom transparent PNG uploaded in admin OR default logo)
    const logoDataUrl =
      siteConfig.brand.logoDataUrl || (await loadDefaultLogoDataUrl());
    let textLeft = margin;
    if (logoDataUrl) {
      try {
        const size = await getImageNaturalSize(logoDataUrl);
        const maxH = 18;
        const maxW = 36;
        let drawW = 24;
        let drawH = 16;
        if (size && size.width > 0 && size.height > 0) {
          const ratio = size.width / size.height;
          drawH = maxH;
          drawW = drawH * ratio;
          if (drawW > maxW) {
            drawW = maxW;
            drawH = drawW / ratio;
          }
        }
        doc.addImage(
          logoDataUrl,
          detectImageFormat(logoDataUrl),
          margin,
          15,
          drawW,
          drawH,
          undefined,
          "FAST"
        );
        textLeft = margin + drawW + 6;
      } catch {
        // Continue cleanly without logo if decode fails
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(28, 27, 25);
    doc.text(siteConfig.brand.name.toUpperCase(), textLeft, 21);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(88, 86, 81);
    doc.text(siteConfig.brand.tagline, textLeft, 26.5);
    doc.text(
      (siteConfig.billing.studioAddress || "").slice(0, 68),
      textLeft,
      32
    );
    if (siteConfig.billing.gstOrRegNo) {
      doc.text(
        `Reg / GST: ${siteConfig.billing.gstOrRegNo.slice(0, 44)}`,
        textLeft,
        37.2
      );
    }

    // Right: Receipt Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(isMinimal ? 28 : 13, isMinimal ? 27 : 92, isMinimal ? 25 : 67);
    doc.text("BILL RECEIPT", pageW - margin, 22, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(92, 90, 85);
    doc.text(siteConfig.brand.contactEmail, pageW - margin, 28, {
      align: "right",
    });

    // Divider
    doc.setDrawColor(225, 220, 210);
    doc.line(margin, 50, pageW - margin, 50);

    drawDynamicDetailsBlock(doc, order, siteConfig, 58, style);

    // Bottom architectural bar
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(130, 128, 122);
    doc.text(
      `${siteConfig.brand.copyright}  |  Computer-generated architectural service receipt`,
      pageW / 2,
      pageH - 12,
      { align: "center" }
    );
  }

  const safeInvoice = (order.invoiceNumber || order.id).replace(
    /[^a-zA-Z0-9_-]/g,
    "_"
  );
  doc.save(`${safeInvoice}_Akvai_Receipt.pdf`);
}

export async function downloadSampleReceiptPdf(
  siteConfig: SiteConfig
): Promise<void> {
  const sampleService = siteConfig.services[0];
  const sampleOrder: OrderItem = {
    id: "ORD-SAMPLE",
    invoiceNumber: `INV-AKV-${new Date().getFullYear()}-SAMPLE`,
    userId: "sample",
    userName: "Aarav Sharma (Sample Client)",
    userEmail: "client@example.com",
    serviceId: sampleService?.id || "2d-layout-plan",
    serviceTitle: sampleService?.title || "2D Layout Plan",
    projectType: "Residential",
    location: "Ahmedabad, Gujarat",
    budgetRange: `Rs. ${(sampleService?.priceInr ?? 2999).toLocaleString("en-IN")}`,
    message:
      "2 BHK ground floor layout with master attached toilet, modular kitchen, car parking, and Vastu-aligned living room.",
    plotDetails: {
      length: "40",
      width: "30",
      unit: "ft",
      areaSq: "1200 sq.ft",
      northSide: "North-East",
      floors: "G+1",
      sketchFileName: "plot-sketch-sample.jpg",
    },
    payment: {
      amountInr: sampleService?.priceInr ?? 2999,
      method: "UPI",
      status: "Paid",
      referenceId: "UTR419823764501",
      paidAt: new Date().toISOString(),
    },
    deliverables: [],
    revisions: [],
    status: "In Progress",
    adminNote: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await downloadOrderReceiptPdf(sampleOrder, siteConfig);
}
