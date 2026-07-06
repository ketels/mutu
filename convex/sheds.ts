import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertShedMember, requireUser } from "./lib/access";

/** Skjullistan: namn, färg, medlemsantal, sakantal, hur många jag delar. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const memberships = await ctx.db
      .query("shedMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return Promise.all(
      memberships.map(async (m) => {
        const shed = (await ctx.db.get(m.shedId))!;
        const members = await ctx.db
          .query("shedMembers")
          .withIndex("by_shed", (q) => q.eq("shedId", m.shedId))
          .collect();
        const shares = await ctx.db
          .query("itemShares")
          .withIndex("by_shed", (q) => q.eq("shedId", m.shedId))
          .collect();
        let mine = 0;
        const memberInitials: string[] = [];
        for (const member of members) {
          const user = await ctx.db.get(member.userId);
          memberInitials.push(initials(user?.name ?? "?"));
        }
        for (const share of shares) {
          const item = await ctx.db.get(share.itemId);
          if (item?.ownerId === userId) mine++;
        }
        return {
          _id: shed._id,
          name: shed.name,
          colorIdx: shed.colorIdx,
          kind: shed.kind ?? "delat",
          memberCount: members.length,
          memberInitials,
          itemCount: shares.length,
          myShareCount: mine,
          role: m.role,
          isMine: m.role === "owner",
          // Får jag dela in saker här? Ägare alltid; medlemmar bara i delade skjul
          canShare: m.role === "owner" || shed.kind !== "privat",
        };
      }),
    );
  },
});

export const get = query({
  args: { shedId: v.id("sheds") },
  handler: async (ctx, { shedId }) => {
    const { userId } = await assertShedMember(ctx, shedId);
    const shed = (await ctx.db.get(shedId))!;

    const memberRows = await ctx.db
      .query("shedMembers")
      .withIndex("by_shed", (q) => q.eq("shedId", shedId))
      .collect();
    const members = await Promise.all(
      memberRows.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          userId: m.userId,
          name: user?.name ?? "Okänd",
          initials: initials(user?.name ?? "?"),
          role: m.role,
          isMe: m.userId === userId,
        };
      }),
    );

    const shares = await ctx.db
      .query("itemShares")
      .withIndex("by_shed", (q) => q.eq("shedId", shedId))
      .collect();
    const items = (
      await Promise.all(
        shares.map(async (share) => {
          const item = await ctx.db.get(share.itemId);
          if (!item) return null;
          const owner = await ctx.db.get(item.ownerId);
          return {
            _id: item._id,
            name: item.name,
            photoUrl: item.photoId
              ? await ctx.storage.getUrl(item.photoId)
              : null,
            ownerName: owner?.name ?? "Okänd",
            isMine: item.ownerId === userId,
          };
        }),
      )
    ).filter((x) => x !== null);

    const myMembership = memberRows.find((m) => m.userId === userId);
    const iAmOwner = myMembership?.role === "owner";
    const ownerRow = memberRows.find((m) => m.role === "owner");
    const ownerUser = ownerRow ? await ctx.db.get(ownerRow.userId) : null;

    return {
      _id: shed._id,
      name: shed.name,
      colorIdx: shed.colorIdx,
      kind: shed.kind ?? "delat",
      iAmOwner,
      canContribute: iAmOwner || shed.kind !== "privat",
      ownerFirst: ownerUser?.name?.split(" ")[0] ?? "ägaren",
      members,
      items,
      myItems: items.filter((i) => i.isMine),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    kind: v.optional(v.union(v.literal("delat"), v.literal("privat"))),
  },
  handler: async (ctx, { name, kind }) => {
    const userId = await requireUser(ctx);
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 60)
      throw new Error("Ogiltigt namn");

    // Round-robin ur paletten baserat på hur många skjul användaren redan är med i
    const memberships = await ctx.db
      .query("shedMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const colorIdx = memberships.length % 5;

    const shedId = await ctx.db.insert("sheds", {
      name: trimmed,
      colorIdx,
      createdBy: userId,
      kind: kind ?? "delat",
    });
    await ctx.db.insert("shedMembers", { shedId, userId, role: "owner" });
    return shedId;
  },
});

export const leave = mutation({
  args: { shedId: v.id("sheds") },
  handler: async (ctx, { shedId }) => {
    const { userId, membership } = await assertShedMember(ctx, shedId);
    // Ta bort mina delningar i skjulet när jag lämnar
    const shares = await ctx.db
      .query("itemShares")
      .withIndex("by_shed", (q) => q.eq("shedId", shedId))
      .collect();
    for (const share of shares) {
      const item = await ctx.db.get(share.itemId);
      if (item?.ownerId === userId) await ctx.db.delete(share._id);
    }
    await ctx.db.delete(membership._id);
  },
});

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}
