import { internalMutation } from "./_generated/server";

/**
 * Engångsmigrering: raderar addressText från alla användare.
 * Körs med `npx convex run migrations:clearAddressText` (+ --prod).
 * Tas bort tillsammans med addressText-fältet i schemat när den körts.
 */
export const clearAddressText = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let n = 0;
    for (const user of users) {
      if ((user as { addressText?: string }).addressText !== undefined) {
        await ctx.db.patch(user._id, { addressText: undefined });
        n++;
      }
    }
    return `Rensade addressText från ${n} användare`;
  },
});
