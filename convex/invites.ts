import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertCanContribute, requireUser } from "./lib/access";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/** Skapa (eller återanvänd) en aktiv inbjudningslänk för ett skjul. */
export const createForShed = mutation({
  args: { shedId: v.id("sheds") },
  handler: async (ctx, { shedId }) => {
    const { userId } = await assertCanContribute(ctx, shedId);

    const existing = await ctx.db
      .query("shedInvites")
      .withIndex("by_shed", (q) => q.eq("shedId", shedId))
      .collect();
    const active = existing.find(
      (i) => i.revokedAt === undefined && i.expiresAt > Date.now(),
    );
    if (active) return active.token;

    const token = generateToken();
    await ctx.db.insert("shedInvites", {
      shedId,
      token,
      createdBy: userId,
      expiresAt: Date.now() + THIRTY_DAYS,
    });
    return token;
  },
});

/** Publik förhandsvisning av en inbjudan (skjulnamn + medlemsantal). */
export const preview = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invite = await ctx.db
      .query("shedInvites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invite || invite.revokedAt !== undefined || invite.expiresAt < Date.now())
      return null;
    const shed = await ctx.db.get(invite.shedId);
    if (!shed) return null;
    const members = await ctx.db
      .query("shedMembers")
      .withIndex("by_shed", (q) => q.eq("shedId", invite.shedId))
      .collect();
    return {
      shedName: shed.name,
      colorIdx: shed.colorIdx,
      memberCount: members.length,
    };
  },
});

/** Gå med i skjulet som token pekar på. Token är kapabiliteten. */
export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await requireUser(ctx);
    const invite = await ctx.db
      .query("shedInvites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invite || invite.revokedAt !== undefined || invite.expiresAt < Date.now())
      throw new Error("Inbjudan är inte giltig längre");

    const existing = await ctx.db
      .query("shedMembers")
      .withIndex("by_shed_user", (q) =>
        q.eq("shedId", invite.shedId).eq("userId", userId),
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("shedMembers", {
        shedId: invite.shedId,
        userId,
        role: "member",
      });
    }
    return invite.shedId;
  },
});

function generateToken() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
