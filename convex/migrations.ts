import { internalMutation } from "./_generated/server";

/**
 * Engångsmigrering: avrundar befintliga koordinater till 3 decimaler
 * (~100 m). Gamla Nominatim-flödet sparade full precision; nya
 * setLocation avrundar alltid. Körs med
 * `npx convex run migrations:roundCoordinates` (+ --prod), tas sedan bort.
 */
export const roundCoordinates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const round3 = (n: number) => Math.round(n * 1000) / 1000;
    const users = await ctx.db.query("users").collect();
    let n = 0;
    for (const user of users) {
      if (user.lat === undefined || user.lng === undefined) continue;
      const lat = round3(user.lat);
      const lng = round3(user.lng);
      if (lat === user.lat && lng === user.lng) continue;
      await ctx.db.patch(user._id, { lat, lng });
      n++;
    }
    return `Avrundade koordinater för ${n} användare`;
  },
});
