import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";
import { fmtRangeSv } from "./lib/format";

type EmailKind =
  | "request" // ny förfrågan → ägaren
  | "approved" // godkänt → låntagaren
  | "proposed" // motförslag → låntagaren
  | "declined" // nekat → låntagaren
  | "returned" // återlämning bekräftad → låntagaren
  | "return_tomorrow" // påminnelse → låntagaren
  | "return_today"
  | "overdue";

export const loanEvent = internalAction({
  args: { loanId: v.id("loans"), kind: v.string() },
  handler: async (ctx, { loanId, kind }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return; // mail avstängt (t.ex. lokal utveckling)

    const data = await ctx.runQuery(internal.emails.loanEmailData, { loanId });
    if (!data) return;

    const email = buildEmail(kind as EmailKind, data);
    if (!email || !email.to) return;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Mutu <onboarding@resend.dev>",
        to: email.to,
        subject: email.subject,
        html: email.html,
      }),
    });
  },
});

export const loanEmailData = internalQuery({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const loan = await ctx.db.get(loanId);
    if (!loan) return null;
    const item = await ctx.db.get(loan.itemId);
    const owner = await ctx.db.get(loan.ownerId);
    const borrower = await ctx.db.get(loan.borrowerId);
    return {
      itemName: item?.name ?? "en sak",
      period: fmtRangeSv(loan.startDay, loan.endDay),
      ownerEmail: owner?.email ?? null,
      ownerFirst: owner?.name?.split(" ")[0] ?? "",
      borrowerEmail: borrower?.email ?? null,
      borrowerFirst: borrower?.name?.split(" ")[0] ?? "",
    };
  },
});

type EmailData = {
  itemName: string;
  period: string;
  ownerEmail: string | null;
  ownerFirst: string;
  borrowerEmail: string | null;
  borrowerFirst: string;
};

function buildEmail(kind: EmailKind, d: EmailData) {
  const site = process.env.SITE_URL ?? "https://mutu.vercel.app";
  const wrap = (title: string, body: string) => ({
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <p style="font-size:22px;font-weight:800;letter-spacing:-0.03em;margin:0 0 16px">mutu</p>
  <h1 style="font-size:19px;margin:0 0 8px">${title}</h1>
  <p style="font-size:15px;color:#45453F;line-height:1.5;margin:0 0 20px">${body}</p>
  <a href="${site}/lan" style="display:inline-block;background:#2F5D50;color:#fff;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px;text-decoration:none">Öppna Mutu</a>
</div>`,
  });

  switch (kind) {
    case "request":
      return {
        to: d.ownerEmail,
        subject: `${d.borrowerFirst} vill låna din ${d.itemName.toLowerCase()}`,
        ...wrap(
          `${d.borrowerFirst} vill låna din ${d.itemName.toLowerCase()}`,
          `Önskad period: ${d.period}. Svara i appen — godkänn, föreslå en annan tid eller säg att det inte går.`,
        ),
      };
    case "approved":
      return {
        to: d.borrowerEmail,
        subject: `Klart! Du får låna ${d.itemName.toLowerCase()}`,
        ...wrap(
          `${d.ownerFirst} har godkänt ditt lån`,
          `${d.itemName} är din ${d.period}. Lånet ligger i din kalender i appen.`,
        ),
      };
    case "proposed":
      return {
        to: d.borrowerEmail,
        subject: `${d.ownerFirst} föreslår en annan tid för ${d.itemName.toLowerCase()}`,
        ...wrap(
          `${d.ownerFirst} föreslår ${d.period}`,
          `Funkar den nya tiden? Svara i appen.`,
        ),
      };
    case "declined":
      return {
        to: d.borrowerEmail,
        subject: `Det gick inte den här gången`,
        ...wrap(
          `${d.ownerFirst} kan inte låna ut ${d.itemName.toLowerCase()}`,
          `Perioden ${d.period} gick inte. Kika i appen efter något liknande i dina skjul.`,
        ),
      };
    case "returned":
      return {
        to: d.borrowerEmail,
        subject: `Återlämning bekräftad — tack för lånet!`,
        ...wrap(
          `${d.itemName} är återlämnad`,
          `${d.ownerFirst} har fått en bekräftelse. Snyggt skött!`,
        ),
      };
    case "return_tomorrow":
      return {
        to: d.borrowerEmail,
        subject: `Imorgon: lämna tillbaka ${d.itemName.toLowerCase()}`,
        ...wrap(
          `Imorgon lämnas ${d.itemName.toLowerCase()} tillbaka`,
          `Lånet från ${d.ownerFirst} (${d.period}) tar slut imorgon.`,
        ),
      };
    case "return_today":
      return {
        to: d.borrowerEmail,
        subject: `Idag: lämna tillbaka ${d.itemName.toLowerCase()}`,
        ...wrap(
          `Idag lämnas ${d.itemName.toLowerCase()} tillbaka`,
          `Sista lånedagen är idag. Bocka av återlämningen i appen när det är gjort.`,
        ),
      };
    case "overdue":
      return {
        to: d.borrowerEmail,
        subject: `Påminnelse: ${d.itemName.toLowerCase()} skulle lämnats tillbaka`,
        ...wrap(
          `${d.itemName} väntar på att komma hem`,
          `Lånet från ${d.ownerFirst} tog slut ${d.period.split("→").pop()?.trim() ?? "nyligen"}. Hör av dig till ${d.ownerFirst} i appen om du behöver mer tid.`,
        ),
      };
  }
}
