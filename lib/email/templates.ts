import { formatDeparture, formatKES } from "@/lib/domain/policy";

export type Email = { subject: string; text: string; html: string };

const esc = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type Row = [label: string, value: string];

function layout(input: {
  heading: string;
  intro: string;
  highlight?: { label: string; value: string };
  rows?: Row[];
  action?: { label: string; url: string };
  footer?: string;
}) {
  const highlight = input.highlight
    ? `<div style="margin:0 0 24px;border-radius:18px;background:#f6f0e8;padding:20px;text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#6e6257;">${esc(input.highlight.label)}</p>
        <p style="margin:0;font-family:'Courier New',monospace;font-size:30px;font-weight:700;letter-spacing:.18em;color:#1d1814;">${esc(input.highlight.value)}</p>
      </div>`
    : "";
  const rows = input.rows?.length
    ? `<table role="presentation" width="100%" style="margin:0 0 24px;border-collapse:collapse;font-size:15px;">${input.rows
        .map(
          ([label, value], i) =>
            `<tr><td style="padding:10px 0;color:#6e6257;${i ? "border-top:1px solid rgba(51,35,24,.1);" : ""}">${esc(label)}</td><td style="padding:10px 0;text-align:right;font-weight:600;${i ? "border-top:1px solid rgba(51,35,24,.1);" : ""}">${esc(value)}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  const action = input.action
    ? `<a href="${esc(input.action.url)}" style="display:inline-block;border-radius:999px;background:#cc6231;color:#ffffff;padding:14px 22px;text-decoration:none;font-weight:700;">${esc(input.action.label)}</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#6e6257;">If the button does not work, paste this URL into your browser:<br /><a href="${esc(input.action.url)}" style="color:#9f421b;word-break:break-all;">${esc(input.action.url)}</a></p>`
    : "";
  const footer = input.footer
    ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#6e6257;">${esc(input.footer)}</p>`
    : "";
  const html = `<div style="background:#f6f0e8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#1d1814;">
  <div style="max-width:560px;margin:0 auto;background:#fffaf5;border:1px solid rgba(51,35,24,.12);border-radius:24px;padding:32px;">
    <p style="margin:0 0 12px;font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:#9f421b;">Uaway</p>
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;">${esc(input.heading)}</h1>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#6e6257;">${esc(input.intro)}</p>
    ${highlight}${rows}${action}${footer}
  </div>
</div>`;
  const text = [
    input.heading,
    "",
    input.intro,
    ...(input.highlight
      ? ["", `${input.highlight.label}: ${input.highlight.value}`]
      : []),
    ...(input.rows?.length
      ? ["", ...input.rows.map(([l, v]) => `${l}: ${v}`)]
      : []),
    ...(input.action ? ["", `${input.action.label}: ${input.action.url}`] : []),
    ...(input.footer ? ["", input.footer] : []),
  ].join("\n");
  return { html, text };
}

const greet = (name?: string | null) =>
  name ? `Hi ${name.split(" ")[0]},` : "Hi there,";

export function accountLinkEmail(
  purpose: "verify" | "reset",
  url: string,
  name?: string | null,
): Email {
  const verify = purpose === "verify";
  return {
    subject: verify ? "Verify your Uaway email" : "Reset your Uaway password",
    ...layout({
      heading: verify ? "Confirm your email address" : "Reset your password",
      intro: verify
        ? `${greet(name)} confirm this email address to start booking and offering rides on Uaway.`
        : `${greet(name)} we received a request to reset your Uaway password. Choose a new one using the button below.`,
      action: {
        label: verify ? "Verify my email" : "Choose a new password",
        url,
      },
      footer:
        "This link expires in 30 minutes. If you did not request it, you can safely ignore this email.",
    }),
  };
}

export function magicLinkEmail(host: string, url: string, expires: Date): Email {
  return {
    subject: `Your sign-in link for ${host}`,
    ...layout({
      heading: "Use your magic link",
      intro: `Click the button below to sign in to ${host}. This link expires on ${formatDeparture(expires)}.`,
      action: { label: "Sign in", url },
      footer: "If you did not request it, you can safely ignore this email.",
    }),
  };
}

export function notificationEmail(
  title: string,
  body: string,
  url: string,
): Email {
  return {
    subject: title,
    ...layout({ heading: title, intro: body, action: { label: "Open Uaway", url } }),
  };
}

type Trip = {
  origin: string;
  destination: string;
  departureTime: Date;
};

export function bookingConfirmedEmail(input: {
  name?: string | null;
  code: string;
  trip: Trip;
  seats: number;
  luggage: number;
  pickupInstructions?: string | null;
  driverName?: string | null;
  vehicle?: string;
  url: string;
}): Email {
  return {
    subject: `Booking confirmed: ${input.trip.origin} to ${input.trip.destination}`,
    ...layout({
      heading: "Your ride is booked",
      intro: `${greet(input.name)} your payment is confirmed. Show your driver this boarding code when you get in the car.`,
      highlight: { label: "Boarding code", value: input.code },
      rows: [
        ["From", input.trip.origin],
        ["To", input.trip.destination],
        ["Departure", formatDeparture(input.trip.departureTime)],
        ["Seats", String(input.seats)],
        ...(input.luggage ? ([["Luggage", String(input.luggage)]] as Row[]) : []),
        ...(input.driverName ? ([["Driver", input.driverName]] as Row[]) : []),
        ...(input.vehicle ? ([["Vehicle", input.vehicle]] as Row[]) : []),
        ...(input.pickupInstructions
          ? ([["Pickup", input.pickupInstructions]] as Row[])
          : []),
      ],
      action: { label: "View booking", url: input.url },
      footer:
        "Keep this code private. Only share it with your driver when you board.",
    }),
  };
}

export function thankYouEmail(input: {
  name?: string | null;
  trip: Trip;
  driverName?: string | null;
  url: string;
}): Email {
  return {
    subject: "Thanks for travelling with Uaway",
    ...layout({
      heading: "Thanks for riding with us",
      intro: `${greet(input.name)} you've arrived. Thank you for travelling from ${input.trip.origin} to ${input.trip.destination} with Uaway. A quick review${input.driverName ? ` of ${input.driverName}` : ""} helps keep the community safe.`,
      action: { label: "Review your trip", url: input.url },
      footer:
        "Something went wrong on this trip? Report it from your booking before settlement and our team will review it.",
    }),
  };
}

export function receiptEmail(input: {
  name?: string | null;
  receiptNo: string;
  paidAt: Date;
  bookingCode: string;
  trip: Trip;
  seats: number;
  fareMinor: number;
  feeMinor: number;
  amountMinor: number;
  method: string;
  phone?: string | null;
  transactionId?: string | null;
  url: string;
}): Email {
  const phone = input.phone ? `•••• ${input.phone.slice(-4)}` : undefined;
  return {
    subject: `Your Uaway receipt ${input.receiptNo}`,
    ...layout({
      heading: "Payment receipt",
      intro: `${greet(input.name)} thanks for your payment. Here is your receipt for booking ${input.bookingCode}.`,
      highlight: { label: "Amount paid", value: formatKES(input.amountMinor) },
      rows: [
        ["Receipt no.", input.receiptNo],
        ["Date", formatDeparture(input.paidAt)],
        ["Trip", `${input.trip.origin} to ${input.trip.destination}`],
        ["Departure", formatDeparture(input.trip.departureTime)],
        [`Fare (${input.seats} seat${input.seats === 1 ? "" : "s"})`, formatKES(input.fareMinor)],
        ...(input.feeMinor
          ? ([["Booking fee", formatKES(input.feeMinor)]] as Row[])
          : []),
        ["Total", formatKES(input.amountMinor)],
        ["Paid with", `${input.method === "mpesa" ? "M-Pesa" : input.method}${phone ? ` ${phone}` : ""}`],
        ...(input.transactionId
          ? ([["Transaction ref.", input.transactionId]] as Row[])
          : []),
      ],
      action: { label: "View booking", url: input.url },
      footer: "Keep this email for your records.",
    }),
  };
}
