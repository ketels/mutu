import { getAuthUserId } from "@convex-dev/auth/server";
import { type Id } from "../_generated/dataModel";
import { type MutationCtx, type QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function requireUser(ctx: Ctx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Inte inloggad");
  return userId;
}

export async function assertShedMember(ctx: Ctx, shedId: Id<"sheds">) {
  const userId = await requireUser(ctx);
  const membership = await ctx.db
    .query("shedMembers")
    .withIndex("by_shed_user", (q) => q.eq("shedId", shedId).eq("userId", userId))
    .unique();
  if (!membership) throw new Error("Inte medlem i skjulet");
  return { userId, membership };
}

/** Ägare, eller medlem i något skjul saken delas i. */
export async function assertCanSeeItem(ctx: Ctx, itemId: Id<"items">) {
  const userId = await requireUser(ctx);
  const item = await ctx.db.get(itemId);
  if (!item) throw new Error("Saken finns inte");
  if (item.ownerId === userId) return { userId, item };

  const shares = await ctx.db
    .query("itemShares")
    .withIndex("by_item", (q) => q.eq("itemId", itemId))
    .collect();
  for (const share of shares) {
    const membership = await ctx.db
      .query("shedMembers")
      .withIndex("by_shed_user", (q) =>
        q.eq("shedId", share.shedId).eq("userId", userId),
      )
      .unique();
    if (membership) return { userId, item };
  }
  throw new Error("Saken delas inte med dig");
}

export async function assertLoanParty(ctx: Ctx, loanId: Id<"loans">) {
  const userId = await requireUser(ctx);
  const loan = await ctx.db.get(loanId);
  if (!loan) throw new Error("Lånet finns inte");
  if (loan.borrowerId !== userId && loan.ownerId !== userId)
    throw new Error("Du är inte part i lånet");
  return { userId, loan };
}
