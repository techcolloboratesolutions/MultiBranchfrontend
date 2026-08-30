import { Partner, PartnerGroup } from "../types/partner";
import { downloadBlob } from "./download";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function whatsappPhone(value: string): string {
  const digits = digitsOnly(value);
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

export function groupWhatsAppUrl(group: PartnerGroup): string | null {
  const raw = (group.whatsapp_group || "").trim();
  if (!raw) {
    return null;
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  if (raw.includes("chat.whatsapp.com") || raw.includes("wa.me/")) {
    return raw.startsWith("http") ? raw : `https://${raw}`;
  }
  const phone = whatsappPhone(raw);
  if (phone.length >= 10) {
    return `https://wa.me/${phone}`;
  }
  return null;
}

export async function sendPdfViaWhatsApp(options: {
  pdf: Uint8Array;
  filename: string;
  caption: string;
  phone?: string;
  group?: PartnerGroup | null;
}): Promise<"shared" | "opened"> {
  const file = new File([options.pdf], options.filename, { type: "application/pdf" });
  const shareData: ShareData = {
    files: [file],
    title: options.filename,
    text: options.caption,
  };
  const canShareFiles =
    typeof navigator.canShare === "function" && navigator.canShare(shareData);
  if (canShareFiles && typeof navigator.share === "function") {
    await navigator.share(shareData);
    return "shared";
  }

  downloadBlob(new Blob([options.pdf], { type: "application/pdf" }), options.filename);
  const phone = options.phone ? whatsappPhone(options.phone) : "";
  const groupUrl = options.group ? groupWhatsAppUrl(options.group) : null;
  const text = encodeURIComponent(`${options.caption}\nAttach the downloaded PDF: ${options.filename}`);
  if (phone.length >= 10) {
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  } else if (groupUrl) {
    window.open(groupUrl, "_blank", "noopener,noreferrer");
  } else {
    window.open(`https://web.whatsapp.com/`, "_blank", "noopener,noreferrer");
  }
  return "opened";
}

export function partnerLabel(partner: Partner): string {
  return partner.mobile ? `${partner.name} (${partner.mobile})` : partner.name;
}
