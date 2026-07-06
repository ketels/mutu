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
