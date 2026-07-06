import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertCanContribute, requireUser } from "./lib/access";

/** Mina saker + deras delningsstatus, för matrisen. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const items = await ctx.db
      .query("items")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    return Promise.all(
      items.map(async (item) => {
        const shares = await ctx.db
          .query("itemShares")
          .withIndex("by_item", (q) => q.eq("itemId", item._id))
          .collect();
        // Aktivt utlån (approved, ej återlämnat) för statusraden
        const loans = await ctx.db
          .query("loans")
          .withIndex("by_item", (q) => q.eq("itemId", item._id))
          .collect();
        const activeLoan = loans.find((l) => l.status === "approved");
        let loanInfo: { borrowerName: string; endDay: string } | null = null;
        if (activeLoan) {
          const borrower = await ctx.db.get(activeLoan.borrowerId);
          loanInfo = {
            borrowerName: borrower?.name?.split(" ")[0] ?? "någon",
            endDay: activeLoan.endDay,
          };
        }
        return {
          _id: item._id,
          name: item.name,
          description: item.description ?? "",
          photoUrl: item.photoId
            ? await ctx.storage.getUrl(item.photoId)
            : null,
          shedIds: shares.map((s) => s.shedId),
          loan: loanInfo,
        };
      }),
    );
  },
});

export const get = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const userId = await requireUser(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || item.ownerId !== userId) return null;
    const shares = await ctx.db
      .query("itemShares")
      .withIndex("by_item", (q) => q.eq("itemId", itemId))
      .collect();
    return {
      _id: item._id,
      name: item.name,
      description: item.description ?? "",
      photoUrl: item.photoId ? await ctx.storage.getUrl(item.photoId) : null,
      shedIds: shares.map((s) => s.shedId),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    shedIds: v.array(v.id("sheds")),
  },
  handler: async (ctx, { name, description, photoId, shedIds }) => {
    const userId = await requireUser(ctx);
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 80)
      throw new Error("Ogiltigt namn");
    if (shedIds.length === 0)
      throw new Error("Välj minst ett skjul");

    // Kräver medlemskap, och för privata skjul ägarroll
    for (const shedId of shedIds) {
      await assertCanContribute(ctx, shedId);
    }

    const itemId = await ctx.db.insert("items", {
      ownerId: userId,
      name: trimmed,
      description: description?.trim() || undefined,
      photoId,
    });
    for (const shedId of shedIds) {
      await ctx.db.insert("itemShares", { itemId, shedId });
    }
    return itemId;
  },
});

export const update = mutation({
  args: {
    itemId: v.id("items"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { itemId, name, description, photoId }) => {
    const userId = await requireUser(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || item.ownerId !== userId) throw new Error("Inte din sak");

    const patch: Record<string, unknown> = {};
    if (name !== undefined) {
      const trimmed = name.trim();
      if (trimmed.length < 1 || trimmed.length > 80)
        throw new Error("Ogiltigt namn");
      patch.name = trimmed;
    }
    if (description !== undefined)
      patch.description = description.trim() || undefined;
    if (photoId !== undefined) patch.photoId = photoId;
    await ctx.db.patch(itemId, patch);
  },
});

export const remove = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const userId = await requireUser(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || item.ownerId !== userId) throw new Error("Inte din sak");

    const loans = await ctx.db
      .query("loans")
      .withIndex("by_item", (q) => q.eq("itemId", itemId))
      .collect();
    const blocking = loans.find(
      (l) =>
        l.status === "approved" ||
        l.status === "pending" ||
        l.status === "proposed",
    );
    if (blocking)
      throw new Error("Saken har ett aktivt lån eller en öppen förfrågan");

    const shares = await ctx.db
      .query("itemShares")
      .withIndex("by_item", (q) => q.eq("itemId", itemId))
      .collect();
    for (const share of shares) await ctx.db.delete(share._id);
    if (item.photoId) await ctx.storage.delete(item.photoId);
    await ctx.db.delete(itemId);
  },
});

/** Slå på/av delning av en sak i ett skjul — matrisens toggle. */
export const toggleShare = mutation({
  args: { itemId: v.id("items"), shedId: v.id("sheds") },
  handler: async (ctx, { itemId, shedId }) => {
    const userId = await requireUser(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || item.ownerId !== userId) throw new Error("Inte din sak");

    const existing = await ctx.db
      .query("itemShares")
      .withIndex("by_item_shed", (q) =>
        q.eq("itemId", itemId).eq("shedId", shedId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    // Att sluta dela är alltid tillåtet; att börja dela kräver rättighet
    await assertCanContribute(ctx, shedId);
    await ctx.db.insert("itemShares", { itemId, shedId });
    return true;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return ctx.storage.generateUploadUrl();
  },
});
