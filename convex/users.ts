import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
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
      addressText: user.addressText ?? null,
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

export const saveLocation = internalMutation({
  args: {
    userId: v.id("users"),
    addressText: v.string(),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, { userId, addressText, lat, lng }) => {
    await ctx.db.patch(userId, { addressText, lat, lng });
  },
});

export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const user = await ctx.db.get(userId);
    if (!user?.name) throw new Error("Namn saknas");
    await ctx.db.patch(userId, { onboardedAt: Date.now() });
  },
});

/**
 * Geokodar en adress via Nominatim (en gång per användare vid onboarding)
 * och sparar resultatet. Returnerar det tolkade platsnamnet för bekräftelse.
 */
export const geocodeAddress = action({
  args: { address: v.string() },
  handler: async (ctx, { address }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Inte inloggad");

    const url =
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=se&q=" +
      encodeURIComponent(address);
    const res = await fetch(url, {
      headers: { "User-Agent": "mutu-app/0.1 (delningstjänst)" },
    });
    if (!res.ok) throw new Error("Kunde inte slå upp adressen");
    const hits = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (hits.length === 0) return null;

    const hit = hits[0];
    await ctx.runMutation(internal.users.saveLocation, {
      userId,
      addressText: address.trim(),
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
    });
    return { displayName: hit.display_name };
  },
});
