import { v } from "convex/values";
import { type Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { assertCanSeeItem, requireUser } from "./lib/access";
import { bookedRanges } from "./loans";
import { todayISO } from "./lib/dates";
import { distanceMeters, formatDistance } from "./lib/geo";

/** Utforska: alla saker i mina skjul (utom mina egna), med sök & filter. */
export const feed = query({
  args: {
    search: v.optional(v.string()),
    shedId: v.optional(v.id("sheds")),
  },
  handler: async (ctx, { search, shedId }) => {
    const userId = await requireUser(ctx);
    const me = await ctx.db.get(userId);
    const today = todayISO();

    const memberships = await ctx.db
      .query("shedMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const myShedIds = memberships.map((m) => m.shedId);
    const shedIds = shedId
      ? myShedIds.filter((id) => id === shedId)
      : myShedIds;

    // Samla saker per skjul; en sak kan delas i flera → dedupe, behåll första skjulet
    const seen = new Map<
      Id<"items">,
      { itemId: Id<"items">; shedId: Id<"sheds"> }
    >();
    for (const sId of shedIds) {
      const shares = await ctx.db
        .query("itemShares")
        .withIndex("by_shed", (q) => q.eq("shedId", sId))
        .collect();
      for (const share of shares) {
        if (!seen.has(share.itemId))
          seen.set(share.itemId, { itemId: share.itemId, shedId: sId });
      }
    }

    const needle = search?.trim().toLowerCase();
    const results = [];
    for (const { itemId, shedId: viaShedId } of seen.values()) {
      const item = await ctx.db.get(itemId);
      if (!item || item.ownerId === userId) continue;
      if (needle && !item.name.toLowerCase().includes(needle)) continue;

      const owner = await ctx.db.get(item.ownerId);
      const shed = await ctx.db.get(viaShedId);
      const booked = await bookedRanges(ctx, itemId);
      const onLoanNow = booked.some(
        (b) => b.start <= today && today <= b.end,
      );

      let distance: string | null = null;
      if (
        me?.lat !== undefined &&
        me?.lng !== undefined &&
        owner?.lat !== undefined &&
        owner?.lng !== undefined
      ) {
        distance = formatDistance(
          distanceMeters(me.lat, me.lng, owner.lat, owner.lng),
        );
      }

      results.push({
        _id: item._id,
        name: item.name,
        photoUrl: item.photoId
          ? await ctx.storage.getUrl(item.photoId)
          : null,
        ownerFirst: owner?.name?.split(" ")[0] ?? "Okänd",
        shedColorIdx: shed?.colorIdx ?? 0,
        distance,
        available: !onLoanNow,
      });
    }

    results.sort((a, b) => a.name.localeCompare(b.name, "sv"));
    return { items: results, total: results.length };
  },
});

/** Sak-detalj för sheeten: beskrivning, ägare, upptagna dagar. */
export const itemDetail = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const { userId, item } = await assertCanSeeItem(ctx, itemId);
    const me = await ctx.db.get(userId);
    const owner = await ctx.db.get(item.ownerId);

    // Via vilket skjul ser jag saken? (första gemensamma)
    const shares = await ctx.db
      .query("itemShares")
      .withIndex("by_item", (q) => q.eq("itemId", itemId))
      .collect();
    let viaShed: { name: string; colorIdx: number } | null = null;
    for (const share of shares) {
      const membership = await ctx.db
        .query("shedMembers")
        .withIndex("by_shed_user", (q) =>
          q.eq("shedId", share.shedId).eq("userId", userId),
        )
        .unique();
      if (membership) {
        const shed = await ctx.db.get(share.shedId);
        if (shed) viaShed = { name: shed.name, colorIdx: shed.colorIdx };
        break;
      }
    }

    let distance: string | null = null;
    if (
      me?.lat !== undefined &&
      me?.lng !== undefined &&
      owner?.lat !== undefined &&
      owner?.lng !== undefined
    ) {
      distance = formatDistance(
        distanceMeters(me.lat, me.lng, owner.lat, owner.lng),
      );
    }

    return {
      _id: item._id,
      name: item.name,
      description: item.description ?? "",
      photoUrl: item.photoId ? await ctx.storage.getUrl(item.photoId) : null,
      ownerFirst: owner?.name?.split(" ")[0] ?? "Okänd",
      isMine: item.ownerId === userId,
      viaShed,
      distance,
      booked: await bookedRanges(ctx, itemId),
      today: todayISO(),
    };
  },
});
