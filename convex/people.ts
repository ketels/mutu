import { v } from "convex/values";
import { type Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import {
  assertCanContribute,
  assertShedMember,
  requireUser,
} from "./lib/access";
import { todayISO } from "./lib/dates";
import { distanceMeters, formatDistance } from "./lib/geo";

/** Alla personer jag delar minst ett skjul med, med de delade skjulen. */
async function connectionsOf(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const memberships = await ctx.db
    .query("shedMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const byUser = new Map<Id<"users">, Id<"sheds">[]>();
  for (const m of memberships) {
    const members = await ctx.db
      .query("shedMembers")
      .withIndex("by_shed", (q) => q.eq("shedId", m.shedId))
      .collect();
    for (const member of members) {
      if (member.userId === userId) continue;
      const sheds = byUser.get(member.userId) ?? [];
      sheds.push(m.shedId);
      byUser.set(member.userId, sheds);
    }
  }
  return byUser;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "?") + (parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "")
  ).toUpperCase();
}

/**
 * Personer jag delar skjul med som inte redan är med i det här skjulet —
 * kandidater för "Bjud in"-pickern.
 */
export const inviteCandidates = query({
  args: { shedId: v.id("sheds") },
  handler: async (ctx, { shedId }) => {
    const { userId } = await assertCanContribute(ctx, shedId);

    const existing = new Set(
      (
        await ctx.db
          .query("shedMembers")
          .withIndex("by_shed", (q) => q.eq("shedId", shedId))
          .collect()
      ).map((m) => m.userId),
    );

    const connections = await connectionsOf(ctx, userId);
    const result = [];
    for (const [candidateId, shedIds] of connections) {
      if (existing.has(candidateId)) continue;
      const user = await ctx.db.get(candidateId);
      if (!user?.name) continue;
      const viaNames = (
        await Promise.all([...new Set(shedIds)].map((id) => ctx.db.get(id)))
      )
        .filter((s) => s !== null)
        .map((s) => s.name);
      result.push({
        userId: candidateId,
        name: user.name,
        initials: initials(user.name),
        via: viaNames.join(", "),
      });
    }
    result.sort((a, b) => a.name.localeCompare(b.name, "sv"));
    return result;
  },
});

/**
 * Lägg till en person jag redan delar skjul med direkt i ett skjul.
 * Betrodda kretsar: alla medlemmar får bjuda in, precis som med länken.
 */
export const addToShed = mutation({
  args: { shedId: v.id("sheds"), userId: v.id("users") },
  handler: async (ctx, { shedId, userId: targetId }) => {
    const { userId } = await assertCanContribute(ctx, shedId);

    const connections = await connectionsOf(ctx, userId);
    if (!connections.has(targetId))
      throw new Error("Ni delar inget skjul än — använd inbjudningslänken");

    const already = await ctx.db
      .query("shedMembers")
      .withIndex("by_shed_user", (q) =>
        q.eq("shedId", shedId).eq("userId", targetId),
      )
      .unique();
    if (already) return;

    await ctx.db.insert("shedMembers", {
      shedId,
      userId: targetId,
      role: "member",
    });
  },
});

/** Profilsida för en person jag delar minst ett skjul med. */
export const profile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId: targetId }) => {
    const me = await requireUser(ctx);
    if (targetId === me) return null; // egen profil har egen sida

    const connections = await connectionsOf(ctx, me);
    const sharedShedIds = connections.get(targetId);
    if (!sharedShedIds) throw new Error("Ni delar inget skjul");

    const target = await ctx.db.get(targetId);
    if (!target) throw new Error("Personen finns inte");
    const meDoc = await ctx.db.get(me);

    const sharedSheds = (
      await Promise.all([...new Set(sharedShedIds)].map((id) => ctx.db.get(id)))
    )
      .filter((s) => s !== null)
      .map((s) => ({ _id: s._id, name: s.name, colorIdx: s.colorIdx }));

    // Deras saker som är synliga för mig (delade i något gemensamt skjul)
    const items = await ctx.db
      .query("items")
      .withIndex("by_owner", (q) => q.eq("ownerId", targetId))
      .collect();
    const shedIdSet = new Set(sharedShedIds);
    const visibleItems = [];
    for (const item of items) {
      const shares = await ctx.db
        .query("itemShares")
        .withIndex("by_item", (q) => q.eq("itemId", item._id))
        .collect();
      const via = shares.find((s) => shedIdSet.has(s.shedId));
      if (!via) continue;
      const shed = await ctx.db.get(via.shedId);
      visibleItems.push({
        _id: item._id,
        name: item.name,
        photoUrl: item.photoId ? await ctx.storage.getUrl(item.photoId) : null,
        shedColorIdx: shed?.colorIdx ?? 0,
      });
    }

    // Lån oss emellan (båda riktningarna, ej nekade/avbrutna)
    const today = todayISO();
    const [iBorrow, iLend] = await Promise.all([
      ctx.db
        .query("loans")
        .withIndex("by_borrower", (q) => q.eq("borrowerId", me))
        .collect(),
      ctx.db
        .query("loans")
        .withIndex("by_owner", (q) => q.eq("ownerId", me))
        .collect(),
    ]);
    const between = [
      ...iBorrow.filter((l) => l.ownerId === targetId),
      ...iLend.filter((l) => l.borrowerId === targetId),
    ].filter((l) => l.status !== "declined" && l.status !== "cancelled");

    const loans = await Promise.all(
      between.map(async (l) => {
        const item = await ctx.db.get(l.itemId);
        return {
          _id: l._id,
          direction: (l.borrowerId === me ? "in" : "out") as "in" | "out",
          itemName: item?.name ?? "Borttagen sak",
          photoUrl: item?.photoId
            ? await ctx.storage.getUrl(item.photoId)
            : null,
          otherName: target.name?.split(" ")[0] ?? "Okänd",
          startDay: l.startDay,
          endDay: l.endDay,
          status: l.status,
          today,
          unread: false,
        };
      }),
    );
    loans.sort((a, b) => b.startDay.localeCompare(a.startDay));

    let distance: string | null = null;
    if (
      meDoc?.lat !== undefined &&
      meDoc?.lng !== undefined &&
      target.lat !== undefined &&
      target.lng !== undefined
    ) {
      distance = formatDistance(
        distanceMeters(meDoc.lat, meDoc.lng, target.lat, target.lng),
      );
    }

    return {
      _id: target._id,
      name: target.name ?? "Okänd",
      initials: initials(target.name ?? "?"),
      distance,
      sharedSheds,
      items: visibleItems,
      loans,
    };
  },
});
