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
    const utanfor = await ctx.db.insert("users", { name: "Utan För", email: "utanfor@test" });

    const shed = await ctx.db.insert("sheds", { name: "Grannar", colorIdx: 1, createdBy: berit });
    await ctx.db.insert("shedMembers", { shedId: shed, userId: berit, role: "owner" });
    await ctx.db.insert("shedMembers", { shedId: shed, userId: jonas, role: "member" });

    const stege = await ctx.db.insert("items", { ownerId: berit, name: "Stege" });
    await ctx.db.insert("itemShares", { itemId: stege, shedId: shed });

    return { berit, jonas, utanfor, shed, stege };
  });
  return { t, ...ids };
}

const asUser = (t: ReturnType<typeof convexTest>, userId: Id<"users">) =>
  t.withIdentity({ subject: `${userId}|session` });

describe("auktorisering", () => {
  it("skjulmedlem ser saken i utforska-flödet", async () => {
    const { t, jonas } = await setup();
    const feed = await asUser(t, jonas).query(api.explore.feed, {});
    expect(feed.items.map((i) => i.name)).toContain("Stege");
  });

  it("icke-medlem ser inte saken", async () => {
    const { t, utanfor, stege } = await setup();
    const feed = await asUser(t, utanfor).query(api.explore.feed, {});
    expect(feed.items).toHaveLength(0);
    await expect(
      asUser(t, utanfor).query(api.explore.itemDetail, { itemId: stege }),
    ).rejects.toThrow("delas inte med dig");
  });

  it("utomstående kan inte läsa någon annans chattråd", async () => {
    const { t, jonas, utanfor, stege } = await setup();
    const loanId = await asUser(t, jonas).mutation(api.loans.request, {
      itemId: stege,
      startDay: "2099-07-10",
      endDay: "2099-07-12",
    });
    await expect(
      asUser(t, utanfor).query(api.messages.forLoan, { loanId }),
    ).rejects.toThrow("inte part");
  });

  it("bara ägaren kan godkänna", async () => {
    const { t, jonas, stege } = await setup();
    const loanId = await asUser(t, jonas).mutation(api.loans.request, {
      itemId: stege,
      startDay: "2099-07-10",
      endDay: "2099-07-12",
    });
    await expect(
      asUser(t, jonas).mutation(api.loans.approve, { loanId }),
    ).rejects.toThrow("Bara ägaren");
  });

  it("man kan inte låna sin egen sak", async () => {
    const { t, berit, stege } = await setup();
    await expect(
      asUser(t, berit).mutation(api.loans.request, {
        itemId: stege,
        startDay: "2099-07-10",
        endDay: "2099-07-12",
      }),
    ).rejects.toThrow("din egen sak");
  });

  it("utgången inbjudningstoken nekas", async () => {
    const { t, berit, jonas, shed } = await setup();
    await t.run(async (ctx) => {
      await ctx.db.insert("shedInvites", {
        shedId: shed,
        token: "gammal-token",
        createdBy: berit,
        expiresAt: Date.now() - 1000,
      });
    });
    await expect(
      asUser(t, jonas).mutation(api.invites.accept, { token: "gammal-token" }),
    ).rejects.toThrow("inte giltig");
  });

  it("delning kräver medlemskap i skjulet", async () => {
    const { t, berit } = await setup();
    // Berit skapar en sak men försöker dela den i ett skjul hon inte är med i
    const { annatSkjul, sak } = await t.run(async (ctx) => {
      const other = await ctx.db.insert("users", { name: "Annan", email: "annan@test" });
      const annatSkjul = await ctx.db.insert("sheds", { name: "Främlingar", colorIdx: 0, createdBy: other });
      await ctx.db.insert("shedMembers", { shedId: annatSkjul, userId: other, role: "owner" });
      const sak = await ctx.db.insert("items", { ownerId: berit, name: "Fogsvans" });
      return { annatSkjul, sak };
    });
    await expect(
      asUser(t, berit).mutation(api.items.toggleShare, { itemId: sak, shedId: annatSkjul }),
    ).rejects.toThrow("Inte medlem");
  });
});

describe("personer", () => {
  it("profil kräver delat skjul", async () => {
    const { t, berit, jonas, utanfor } = await setup();
    await expect(
      asUser(t, utanfor).query(api.people.profile, { userId: jonas }),
    ).rejects.toThrow("delar inget skjul");
    const profile = await asUser(t, jonas).query(api.people.profile, {
      userId: berit,
    });
    expect(profile?.name).toBe("Berit Lindgren");
  });

  it("addToShed kräver befintlig koppling", async () => {
    const { t, berit, utanfor, shed } = await setup();
    await expect(
      asUser(t, berit).mutation(api.people.addToShed, {
        shedId: shed,
        userId: utanfor,
      }),
    ).rejects.toThrow("delar inget skjul");
  });

  it("addToShed lägger till kopplad person i nytt skjul", async () => {
    const { t, berit, jonas } = await setup();
    const nyttSkjul = await asUser(t, berit).mutation(api.sheds.create, {
      name: "Bokklubben",
    });
    const candidates = await asUser(t, berit).query(
      api.people.inviteCandidates,
      { shedId: nyttSkjul },
    );
    expect(candidates.map((c) => c.name)).toContain("Jonas Ek");

    await asUser(t, berit).mutation(api.people.addToShed, {
      shedId: nyttSkjul,
      userId: jonas,
    });
    const shedData = await asUser(t, jonas).query(api.sheds.get, {
      shedId: nyttSkjul,
    });
    expect(shedData.members.map((m) => m.name)).toContain("Jonas Ek");
  });
});

describe("privata skjul", () => {
  it("medlem kan inte dela in saker i privat skjul", async () => {
    const { t, berit, jonas } = await setup();
    const privat = await asUser(t, berit).mutation(api.sheds.create, {
      name: "Vänner",
      kind: "privat",
    });
    await asUser(t, berit).mutation(api.people.addToShed, {
      shedId: privat,
      userId: jonas,
    });

    const { jonasSak } = await t.run(async (ctx) => ({
      jonasSak: await ctx.db.insert("items", { ownerId: jonas, name: "Såg" }),
    }));
    await expect(
      asUser(t, jonas).mutation(api.items.toggleShare, {
        itemId: jonasSak,
        shedId: privat,
      }),
    ).rejects.toThrow("Bara ägaren");
  });

  it("nya skjul är privata om inget anges", async () => {
    const { t, berit, jonas } = await setup();
    const shedId = await asUser(t, berit).mutation(api.sheds.create, {
      name: "Vänner",
    });
    await asUser(t, berit).mutation(api.people.addToShed, {
      shedId,
      userId: jonas,
    });
    await expect(
      asUser(t, jonas).mutation(api.invites.createForShed, { shedId }),
    ).rejects.toThrow("Bara ägaren");
  });

  it("bara ägaren kan slå på Delat skjul", async () => {
    const { t, berit, jonas, shed } = await setup();
    await expect(
      asUser(t, jonas).mutation(api.sheds.setKind, {
        shedId: shed,
        kind: "privat",
      }),
    ).rejects.toThrow("Bara ägaren");
    await asUser(t, berit).mutation(api.sheds.setKind, {
      shedId: shed,
      kind: "privat",
    });
    const list = await asUser(t, jonas).query(api.sheds.list, {});
    expect(list.find((s) => s._id === shed)?.canShare).toBe(false);
  });

  it("medlem kan inte bjuda in till privat skjul", async () => {
    const { t, berit, jonas } = await setup();
    const privat = await asUser(t, berit).mutation(api.sheds.create, {
      name: "Vänner",
      kind: "privat",
    });
    await asUser(t, berit).mutation(api.people.addToShed, {
      shedId: privat,
      userId: jonas,
    });
    await expect(
      asUser(t, jonas).mutation(api.invites.createForShed, { shedId: privat }),
    ).rejects.toThrow("Bara ägaren");
    // Ägaren kan fortfarande
    const token = await asUser(t, berit).mutation(api.invites.createForShed, {
      shedId: privat,
    });
    expect(token).toBeTruthy();
  });

  it("delat skjul tillåter medlemmar att dela in och bjuda in", async () => {
    const { t, jonas, shed } = await setup();
    const { jonasSak } = await t.run(async (ctx) => ({
      jonasSak: await ctx.db.insert("items", { ownerId: jonas, name: "Såg" }),
    }));
    const on = await asUser(t, jonas).mutation(api.items.toggleShare, {
      itemId: jonasSak,
      shedId: shed,
    });
    expect(on).toBe(true);
    const token = await asUser(t, jonas).mutation(api.invites.createForShed, {
      shedId: shed,
    });
    expect(token).toBeTruthy();
  });
});

describe("dubbelbokning", () => {
  it("avvisar förfrågan som krockar med godkänt lån", async () => {
    const { t, berit, jonas, stege } = await setup();
    const loanId = await asUser(t, jonas).mutation(api.loans.request, {
      itemId: stege,
      startDay: "2099-07-10",
      endDay: "2099-07-14",
    });
    await asUser(t, berit).mutation(api.loans.approve, { loanId });

    await expect(
      asUser(t, jonas).mutation(api.loans.request, {
        itemId: stege,
        startDay: "2099-07-12",
        endDay: "2099-07-16",
      }),
    ).rejects.toThrow("krockar");
  });

  it("tillåter kant-i-kant utan överlapp", async () => {
    const { t, berit, jonas, stege } = await setup();
    const first = await asUser(t, jonas).mutation(api.loans.request, {
      itemId: stege,
      startDay: "2099-07-10",
      endDay: "2099-07-12",
    });
    await asUser(t, berit).mutation(api.loans.approve, { loanId: first });

    const second = await asUser(t, jonas).mutation(api.loans.request, {
      itemId: stege,
      startDay: "2099-07-13",
      endDay: "2099-07-14",
    });
    expect(second).toBeDefined();
  });

  it("statusmaskinen stoppar dubbelt godkännande", async () => {
    const { t, berit, jonas, stege } = await setup();
    const loanId = await asUser(t, jonas).mutation(api.loans.request, {
      itemId: stege,
      startDay: "2099-07-10",
      endDay: "2099-07-12",
    });
    await asUser(t, berit).mutation(api.loans.approve, { loanId });
    await expect(
      asUser(t, berit).mutation(api.loans.approve, { loanId }),
    ).rejects.toThrow("redan avgjord");
  });
});
