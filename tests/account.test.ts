import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import { type Id } from "../convex/_generated/dataModel";
import schema from "../convex/schema";

// Ladda Convex-funktionerna explicit (Vitest utanför convex/-mappen)
const modules = import.meta.glob([
  "../convex/**/*.ts",
  "../convex/_generated/*.js",
  "!../convex/**/*.d.ts",
]);

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const berit = await ctx.db.insert("users", { name: "Berit Lindgren", email: "berit@test" });
    const jonas = await ctx.db.insert("users", { name: "Jonas Ek", email: "jonas@test" });

    const shed = await ctx.db.insert("sheds", { name: "Grannar", colorIdx: 1, createdBy: berit });
    await ctx.db.insert("shedMembers", { shedId: shed, userId: berit, role: "owner" });
    await ctx.db.insert("shedMembers", { shedId: shed, userId: jonas, role: "member" });

    const soloShed = await ctx.db.insert("sheds", { name: "Ensam", colorIdx: 2, createdBy: berit });
    await ctx.db.insert("shedMembers", { shedId: soloShed, userId: berit, role: "owner" });
    await ctx.db.insert("shedInvites", {
      shedId: soloShed,
      token: "tok-berit",
      createdBy: berit,
      expiresAt: Date.now() + 1000_000,
    });

    const stege = await ctx.db.insert("items", { ownerId: berit, name: "Stege" });
    await ctx.db.insert("itemShares", { itemId: stege, shedId: shed });

    return { berit, jonas, shed, soloShed, stege };
  });
  return { t, ...ids };
}

const asUser = (t: ReturnType<typeof convexTest>, userId: Id<"users">) =>
  t.withIdentity({ subject: `${userId}|session` });

describe("kontoradering", () => {
  it("raderar användaren, sakerna, lånehistoriken och medlemskapen", async () => {
    const { t, berit, jonas, stege } = await setup();

    // Avslutat lån med chatt
    const loanId = await asUser(t, jonas).mutation(api.loans.request, {
      itemId: stege,
      startDay: "2099-07-10",
      endDay: "2099-07-12",
    });
    await asUser(t, berit).mutation(api.loans.approve, { loanId });
    await asUser(t, berit).mutation(api.loans.markReturned, { loanId });

    await asUser(t, berit).mutation(api.users.deleteAccount, {});

    await t.run(async (ctx) => {
      expect(await ctx.db.get(berit)).toBeNull();
      expect(await ctx.db.get(stege)).toBeNull();
      expect(await ctx.db.query("loans").collect()).toHaveLength(0);
      expect(await ctx.db.query("messages").collect()).toHaveLength(0);
      expect(await ctx.db.query("loanReads").collect()).toHaveLength(0);
      expect(await ctx.db.query("itemShares").collect()).toHaveLength(0);
      const memberships = await ctx.db.query("shedMembers").collect();
      expect(memberships.every((m) => m.userId !== berit)).toBe(true);
    });
  });

  it("överlåter ägda skjul till äldsta medlem och raderar tomma", async () => {
    const { t, berit, jonas, shed, soloShed } = await setup();
    await asUser(t, berit).mutation(api.users.deleteAccount, {});

    await t.run(async (ctx) => {
      // Skjulet med Jonas lever vidare med honom som ägare
      const kept = await ctx.db.get(shed);
      expect(kept?.createdBy).toBe(jonas);
      const jonasMembership = await ctx.db
        .query("shedMembers")
        .withIndex("by_shed_user", (q) => q.eq("shedId", shed).eq("userId", jonas))
        .unique();
      expect(jonasMembership?.role).toBe("owner");

      // Ensamskjulet raderas med sin inbjudningslänk
      expect(await ctx.db.get(soloShed)).toBeNull();
      expect(await ctx.db.query("shedInvites").collect()).toHaveLength(0);
    });
  });

  it("blockeras av aktiva lån och öppna förfrågningar", async () => {
    const { t, berit, jonas, stege } = await setup();
    await asUser(t, jonas).mutation(api.loans.request, {
      itemId: stege,
      startDay: "2099-07-10",
      endDay: "2099-07-12",
    });

    // Både ägaren (förfrågan till mig) och låntagaren blockeras
    await expect(
      asUser(t, berit).mutation(api.users.deleteAccount, {}),
    ).rejects.toThrow("avsluta dem först");
    await expect(
      asUser(t, jonas).mutation(api.users.deleteAccount, {}),
    ).rejects.toThrow("avsluta dem först");
  });

  it("touch stämplar lastSeenAt men högst var 6:e timme", async () => {
    const { t, berit } = await setup();

    await asUser(t, berit).mutation(api.users.touch, {});
    const first = await t.run(async (ctx) => (await ctx.db.get(berit))?.lastSeenAt);
    expect(first).toBeTypeOf("number");

    // Nyligen stämplad → ingen ny skrivning
    await asUser(t, berit).mutation(api.users.touch, {});
    const second = await t.run(async (ctx) => (await ctx.db.get(berit))?.lastSeenAt);
    expect(second).toBe(first);

    // Äldre än 6 timmar → uppdateras
    const old = Date.now() - 7 * 60 * 60 * 1000;
    await t.run(async (ctx) => {
      await ctx.db.patch(berit, { lastSeenAt: old });
    });
    await asUser(t, berit).mutation(api.users.touch, {});
    const third = await t.run(async (ctx) => (await ctx.db.get(berit))?.lastSeenAt);
    expect(third).toBeGreaterThan(old);
  });

  it("utloggad touch är tyst och raderar ingenting", async () => {
    const { t } = await setup();
    await expect(t.mutation(api.users.touch, {})).resolves.toBeNull();
    await expect(t.mutation(api.users.deleteAccount, {})).rejects.toThrow();
  });
});
