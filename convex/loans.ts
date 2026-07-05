import { v } from "convex/values";
import { type Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import {
  assertCanSeeItem,
  assertLoanParty,
  requireUser,
} from "./lib/access";
import { isValidISODate, rangesOverlap, todayISO } from "./lib/dates";

/** Upptagna perioder för en sak (godkända lån som inte återlämnats). */
export async function bookedRanges(
  ctx: QueryCtx | MutationCtx,
  itemId: Id<"items">,
  excludeLoanId?: Id<"loans">,
) {
  const loans = await ctx.db
    .query("loans")
    .withIndex("by_item", (q) => q.eq("itemId", itemId))
    .collect();
  return loans
    .filter(
      (l) =>
        l.status === "approved" &&
        l.returnedAt === undefined &&
        l._id !== excludeLoanId,
    )
    .map((l) => ({ start: l.startDay, end: l.endDay }));
}

function assertValidRange(startDay: string, endDay: string) {
  if (!isValidISODate(startDay) || !isValidISODate(endDay))
    throw new Error("Ogiltigt datum");
  if (endDay < startDay) throw new Error("Slutdag före startdag");
  if (startDay < todayISO()) throw new Error("Perioden har redan passerat");
}

async function assertNoConflict(
  ctx: QueryCtx | MutationCtx,
  itemId: Id<"items">,
  startDay: string,
  endDay: string,
  excludeLoanId?: Id<"loans">,
) {
  const booked = await bookedRanges(ctx, itemId, excludeLoanId);
  if (booked.some((b) => rangesOverlap(startDay, endDay, b.start, b.end)))
    throw new Error("Perioden krockar med upptagna dagar");
}

/**
 * Skapa låneförfrågan: lån + systemnotis + ev. eget meddelande + periodkort,
 * allt i en transaktion. Returnerar loanId (chattråden).
 */
export const request = mutation({
  args: {
    itemId: v.id("items"),
    startDay: v.string(),
    endDay: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { itemId, startDay, endDay, message }) => {
    const { userId, item } = await assertCanSeeItem(ctx, itemId);
    if (item.ownerId === userId)
      throw new Error("Du kan inte låna din egen sak");
    assertValidRange(startDay, endDay);
    await assertNoConflict(ctx, itemId, startDay, endDay);

    const owner = await ctx.db.get(item.ownerId);
    const ownerFirst = owner?.name?.split(" ")[0] ?? "ägaren";

    const loanId = await ctx.db.insert("loans", {
      itemId,
      borrowerId: userId,
      ownerId: item.ownerId,
      startDay,
      endDay,
      status: "pending",
    });

    await ctx.db.insert("messages", {
      loanId,
      kind: "system",
      body: "Förfrågan skickad",
    });
    const text =
      message?.trim() ||
      `Hej ${ownerFirst}! Jag skulle gärna låna ${item.name.toLowerCase()}.`;
    await ctx.db.insert("messages", {
      loanId,
      senderId: userId,
      kind: "text",
      body: text,
    });
    await ctx.db.insert("messages", {
      loanId,
      senderId: userId,
      kind: "period",
      body: "Önskad period",
      proposalStart: startDay,
      proposalEnd: endDay,
    });

    // Låntagaren har läst sin egen tråd
    await ctx.db.insert("loanReads", {
      loanId,
      userId,
      lastReadAt: Date.now(),
    });

    return loanId;
  },
});

/** Ägaren godkänner förfrågan som den är. */
export const approve = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const { userId, loan } = await assertLoanParty(ctx, loanId);
    if (userId !== loan.ownerId) throw new Error("Bara ägaren kan godkänna");
    if (loan.status !== "pending" && loan.status !== "proposed")
      throw new Error("Förfrågan är redan avgjord");
    await assertNoConflict(ctx, loan.itemId, loan.startDay, loan.endDay, loanId);

    await ctx.db.patch(loanId, { status: "approved" });
    await ctx.db.insert("messages", {
      loanId,
      kind: "proposal",
      body: "Godkänt",
      proposalStart: loan.startDay,
      proposalEnd: loan.endDay,
      proposalState: "accepted",
    });
  },
});

/** Ägaren föreslår en annan period. */
export const propose = mutation({
  args: {
    loanId: v.id("loans"),
    startDay: v.string(),
    endDay: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { loanId, startDay, endDay, message }) => {
    const { userId, loan } = await assertLoanParty(ctx, loanId);
    if (userId !== loan.ownerId)
      throw new Error("Bara ägaren kan föreslå datum");
    if (loan.status !== "pending" && loan.status !== "proposed")
      throw new Error("Förfrågan är redan avgjord");
    assertValidRange(startDay, endDay);
    await assertNoConflict(ctx, loan.itemId, startDay, endDay, loanId);

    // Dölj tidigare öppna förslag
    await hideOpenProposals(ctx, loanId);

    if (message?.trim()) {
      await ctx.db.insert("messages", {
        loanId,
        senderId: userId,
        kind: "text",
        body: message.trim(),
      });
    }
    await ctx.db.insert("messages", {
      loanId,
      senderId: userId,
      kind: "proposal",
      body: "föreslår",
      proposalStart: startDay,
      proposalEnd: endDay,
      proposalState: "open",
    });
    await ctx.db.patch(loanId, { status: "proposed", startDay, endDay });
  },
});

/** Låntagaren accepterar ägarens motförslag ("Funkar!"). */
export const acceptProposal = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const { userId, loan } = await assertLoanParty(ctx, loanId);
    if (userId !== loan.borrowerId)
      throw new Error("Bara låntagaren kan acceptera");
    if (loan.status !== "proposed") throw new Error("Inget öppet förslag");
    await assertNoConflict(ctx, loan.itemId, loan.startDay, loan.endDay, loanId);

    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_loan", (q) => q.eq("loanId", loanId))
      .collect();
    for (const m of msgs) {
      if (m.kind === "proposal" && m.proposalState === "open")
        await ctx.db.patch(m._id, { proposalState: "accepted" });
    }
    await ctx.db.patch(loanId, { status: "approved" });
  },
});

/** Låntagaren tackar nej till motförslaget ("Annat datum"). */
export const declineProposal = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const { userId, loan } = await assertLoanParty(ctx, loanId);
    if (userId !== loan.borrowerId)
      throw new Error("Bara låntagaren kan svara");
    if (loan.status !== "proposed") throw new Error("Inget öppet förslag");

    await hideOpenProposals(ctx, loanId);
    await ctx.db.insert("messages", {
      loanId,
      senderId: userId,
      kind: "text",
      body: "Hmm, det passar sämre — jag återkommer med nya datum!",
    });
    await ctx.db.patch(loanId, { status: "pending" });
  },
});

/** Ägaren nekar förfrågan ("Kan inte"). */
export const decline = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const { userId, loan } = await assertLoanParty(ctx, loanId);
    if (userId !== loan.ownerId) throw new Error("Bara ägaren kan neka");
    if (loan.status !== "pending" && loan.status !== "proposed")
      throw new Error("Förfrågan är redan avgjord");
    await hideOpenProposals(ctx, loanId);
    await ctx.db.patch(loanId, { status: "declined" });
    await ctx.db.insert("messages", {
      loanId,
      kind: "system",
      body: "Förfrågan nekades",
    });
  },
});

/** Låntagaren drar tillbaka sin förfrågan. */
export const cancel = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const { userId, loan } = await assertLoanParty(ctx, loanId);
    if (userId !== loan.borrowerId)
      throw new Error("Bara låntagaren kan avbryta");
    if (loan.status !== "pending" && loan.status !== "proposed")
      throw new Error("Förfrågan är redan avgjord");
    await hideOpenProposals(ctx, loanId);
    await ctx.db.patch(loanId, { status: "cancelled" });
    await ctx.db.insert("messages", {
      loanId,
      kind: "system",
      body: "Förfrågan drogs tillbaka",
    });
  },
});

/** Endera parten markerar saken som återlämnad ("Klart ✓"). */
export const markReturned = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const { loan } = await assertLoanParty(ctx, loanId);
    if (loan.status !== "approved") throw new Error("Lånet pågår inte");
    await ctx.db.patch(loanId, {
      status: "returned",
      returnedAt: Date.now(),
    });
    await ctx.db.insert("messages", {
      loanId,
      kind: "system",
      body: "Återlämnad — tack för lånet!",
    });
  },
});

async function hideOpenProposals(ctx: MutationCtx, loanId: Id<"loans">) {
  const msgs = await ctx.db
    .query("messages")
    .withIndex("by_loan", (q) => q.eq("loanId", loanId))
    .collect();
  for (const m of msgs) {
    if (m.kind === "proposal" && m.proposalState === "open")
      await ctx.db.patch(m._id, { proposalState: "hidden" });
  }
}

/** Upptagna dagar för lånets sak (exkl. lånet självt) — för motförslag. */
export const availabilityForLoan = query({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const { loan } = await assertLoanParty(ctx, loanId);
    return {
      booked: await bookedRanges(ctx, loan.itemId, loanId),
      today: todayISO(),
    };
  },
});

/** Lån-fliken: allt jag lånar och lånar ut, med visningsdata. */
export const myLoans = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const today = todayISO();

    const [asBorrower, asOwner] = await Promise.all([
      ctx.db
        .query("loans")
        .withIndex("by_borrower", (q) => q.eq("borrowerId", userId))
        .collect(),
      ctx.db
        .query("loans")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId))
        .collect(),
    ]);

    const decorate = async (
      loan: (typeof asBorrower)[number],
      direction: "in" | "out",
    ) => {
      const item = await ctx.db.get(loan.itemId);
      const other = await ctx.db.get(
        direction === "in" ? loan.ownerId : loan.borrowerId,
      );
      const read = await ctx.db
        .query("loanReads")
        .withIndex("by_user_loan", (q) =>
          q.eq("userId", userId).eq("loanId", loan._id),
        )
        .unique();
      const lastMsgs = await ctx.db
        .query("messages")
        .withIndex("by_loan", (q) => q.eq("loanId", loan._id))
        .order("desc")
        .take(1);
      const lastActivity = lastMsgs[0]?._creationTime ?? loan._creationTime;
      return {
        _id: loan._id,
        direction,
        itemName: item?.name ?? "Borttagen sak",
        photoUrl: item?.photoId
          ? await ctx.storage.getUrl(item.photoId)
          : null,
        otherName: other?.name?.split(" ")[0] ?? "Okänd",
        startDay: loan.startDay,
        endDay: loan.endDay,
        status: loan.status,
        today,
        unread: (read?.lastReadAt ?? 0) < lastActivity,
        lastActivity,
      };
    };

    const loans = [
      ...(await Promise.all(asBorrower.map((l) => decorate(l, "in")))),
      ...(await Promise.all(asOwner.map((l) => decorate(l, "out")))),
    ];
    loans.sort((a, b) => b.lastActivity - a.lastActivity);
    return { loans, today };
  },
});
