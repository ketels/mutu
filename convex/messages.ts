import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertLoanParty } from "./lib/access";

/** Chattråden för ett lån, med visningsdata för huvudet. */
export const forLoan = query({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const { userId, loan } = await assertLoanParty(ctx, loanId);
    const item = await ctx.db.get(loan.itemId);
    const otherId =
      loan.borrowerId === userId ? loan.ownerId : loan.borrowerId;
    const other = await ctx.db.get(otherId);

    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_loan", (q) => q.eq("loanId", loanId))
      .collect();

    return {
      loan: {
        _id: loan._id,
        status: loan.status,
        startDay: loan.startDay,
        endDay: loan.endDay,
        iAmOwner: loan.ownerId === userId,
        otherId,
        itemName: item?.name ?? "Borttagen sak",
        otherName: other?.name ?? "Okänd",
        otherFirst: other?.name?.split(" ")[0] ?? "Okänd",
      },
      messages: msgs
        .filter((m) => m.proposalState !== "hidden")
        .map((m) => ({
          _id: m._id,
          kind: m.kind,
          body: m.body,
          mine: m.senderId === userId,
          proposalStart: m.proposalStart,
          proposalEnd: m.proposalEnd,
          proposalState: m.proposalState,
          senderFirst: m.senderId === otherId ? (other?.name?.split(" ")[0] ?? "") : "",
        })),
    };
  },
});

export const send = mutation({
  args: { loanId: v.id("loans"), body: v.string() },
  handler: async (ctx, { loanId, body }) => {
    const { userId } = await assertLoanParty(ctx, loanId);
    const trimmed = body.trim();
    if (!trimmed || trimmed.length > 2000) throw new Error("Ogiltigt meddelande");
    await ctx.db.insert("messages", {
      loanId,
      senderId: userId,
      kind: "text",
      body: trimmed,
    });
  },
});

/** Markera tråden som läst (styr notisprick + SVARA-pill). */
export const markRead = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const { userId } = await assertLoanParty(ctx, loanId);
    const existing = await ctx.db
      .query("loanReads")
      .withIndex("by_user_loan", (q) =>
        q.eq("userId", userId).eq("loanId", loanId),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { lastReadAt: Date.now() });
    } else {
      await ctx.db.insert("loanReads", {
        loanId,
        userId,
        lastReadAt: Date.now(),
      });
    }
  },
});

/** Finns oläst aktivitet? Driver notispricken på Lån-tabben. */
export const hasUnread = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

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

    for (const loan of [...asBorrower, ...asOwner]) {
      const read = await ctx.db
        .query("loanReads")
        .withIndex("by_user_loan", (q) =>
          q.eq("userId", userId).eq("loanId", loan._id),
        )
        .unique();
      const last = await ctx.db
        .query("messages")
        .withIndex("by_loan", (q) => q.eq("loanId", loan._id))
        .order("desc")
        .take(1);
      const lastActivity = last[0]?._creationTime ?? loan._creationTime;
      if ((read?.lastReadAt ?? 0) < lastActivity) return true;
    }
    return false;
  },
});
