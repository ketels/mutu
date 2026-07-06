import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/access";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name ?? null,
      email: user.email ?? null,
      lat: user.lat ?? null,
      lng: user.lng ?? null,
      onboarded: user.onboardedAt !== undefined,
    };
  },
});

export const setName = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await requireUser(ctx);
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 80)
      throw new Error("Ogiltigt namn");
    await ctx.db.patch(userId, { name: trimmed });
  },
});

/**
 * Sparar användarens ungefärliga position. Avrundas till 3 decimaler
 * (~100 m) så att en exakt hempunkt aldrig lagras.
 */
export const setLocation = mutation({
  args: { lat: v.number(), lng: v.number() },
  handler: async (ctx, { lat, lng }) => {
    const userId = await requireUser(ctx);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    )
      throw new Error("Ogiltig position");
    const round3 = (n: number) => Math.round(n * 1000) / 1000;
    await ctx.db.patch(userId, { lat: round3(lat), lng: round3(lng) });
  },
});

/**
 * Stämplar senaste aktivitet (för framtida gallring av inaktiva konton).
 * Anropas vid applast; skriver högst var 6:e timme och är avsiktligt
 * tyst för utloggade så den aldrig felar under utloggning.
 */
export const touch = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const user = await ctx.db.get(userId);
    if (!user) return;
    const now = Date.now();
    if (user.lastSeenAt !== undefined && now - user.lastSeenAt < 6 * 60 * 60 * 1000)
      return;
    await ctx.db.patch(userId, { lastSeenAt: now });
  },
});

/**
 * Raderar kontot och all data som hör till det (GDPR). Skjul som ägs
 * och har andra medlemmar överlåts till den äldsta medlemmen; tomma
 * skjul raderas. Blockeras om det finns aktiva lån eller öppna
 * förfrågningar — de måste avslutas först.
 */
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);

    const asBorrower = await ctx.db
      .query("loans")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", userId))
      .collect();
    const asOwner = await ctx.db
      .query("loans")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    const loans = [
      ...new Map([...asBorrower, ...asOwner].map((l) => [l._id, l])).values(),
    ];
    if (
      loans.some(
        (l) =>
          l.status === "pending" ||
          l.status === "proposed" ||
          l.status === "approved",
      )
    )
      throw new Error(
        "Du har pågående lån eller öppna förfrågningar — avsluta dem först",
      );

    // Lånehistorik med chattar och lässtatus
    for (const loan of loans) {
      const msgs = await ctx.db
        .query("messages")
        .withIndex("by_loan", (q) => q.eq("loanId", loan._id))
        .collect();
      for (const msg of msgs) await ctx.db.delete(msg._id);
      for (const uid of [loan.borrowerId, loan.ownerId]) {
        const read = await ctx.db
          .query("loanReads")
          .withIndex("by_user_loan", (q) =>
            q.eq("userId", uid).eq("loanId", loan._id),
          )
          .unique();
        if (read) await ctx.db.delete(read._id);
      }
      await ctx.db.delete(loan._id);
    }

    // Saker med delningar och foton
    const items = await ctx.db
      .query("items")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    for (const item of items) {
      const shares = await ctx.db
        .query("itemShares")
        .withIndex("by_item", (q) => q.eq("itemId", item._id))
        .collect();
      for (const share of shares) await ctx.db.delete(share._id);
      if (item.photoId) await ctx.storage.delete(item.photoId);
      await ctx.db.delete(item._id);
    }

    // Skjul: egna inbjudningslänkar bort; ägda skjul överlåts eller raderas
    const memberships = await ctx.db
      .query("shedMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const membership of memberships) {
      const invites = await ctx.db
        .query("shedInvites")
        .withIndex("by_shed", (q) => q.eq("shedId", membership.shedId))
        .collect();
      for (const invite of invites)
        if (invite.createdBy === userId) await ctx.db.delete(invite._id);

      if (membership.role === "owner") {
        const others = (
          await ctx.db
            .query("shedMembers")
            .withIndex("by_shed", (q) => q.eq("shedId", membership.shedId))
            .collect()
        ).filter((m) => m._id !== membership._id);
        if (others.length === 0) {
          const shares = await ctx.db
            .query("itemShares")
            .withIndex("by_shed", (q) => q.eq("shedId", membership.shedId))
            .collect();
          for (const share of shares) await ctx.db.delete(share._id);
          for (const invite of invites)
            if (invite.createdBy !== userId) await ctx.db.delete(invite._id);
          await ctx.db.delete(membership.shedId);
        } else {
          const oldest = others.sort(
            (a, b) => a._creationTime - b._creationTime,
          )[0];
          await ctx.db.patch(oldest._id, { role: "owner" });
          await ctx.db.patch(membership.shedId, { createdBy: oldest.userId });
        }
      }
      await ctx.db.delete(membership._id);
    }

    // Auth-data: konton, verifieringskoder, sessioner, refresh-tokens
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of accounts) {
      const codes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      for (const code of codes) await ctx.db.delete(code._id);
      await ctx.db.delete(account._id);
    }
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of sessions) {
      const tokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of tokens) await ctx.db.delete(token._id);
      await ctx.db.delete(session._id);
    }

    await ctx.db.delete(userId);
  },
});

export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const user = await ctx.db.get(userId);
    if (!user?.name) throw new Error("Namn saknas");
    if (user.lat === undefined || user.lng === undefined)
      throw new Error("Plats saknas");
    await ctx.db.patch(userId, { onboardedAt: Date.now() });
  },
});
