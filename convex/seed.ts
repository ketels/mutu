import { createAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { type Id } from "./_generated/dataModel";
import { internalAction, internalMutation } from "./_generated/server";
import { addDays, todayISO } from "./lib/dates";

/**
 * Utvecklingsseed. Kör: npx convex run seed:run
 * Skapar tre lösenordskonton (lösenord: mutu1234), två skjul med fasta
 * inbjudningstokens (dev-grannar, dev-vanner), saker och ett par lån.
 * Idempotent: kör inte om Berit redan finns.
 */
export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.runMutation(internal.seed.checkSeeded, {});
    if (existing) return "Redan seedat";

    const users = [
      { name: "Berit Lindgren", email: "berit@dev.mutu", lat: 59.1953, lng: 17.9041 },
      { name: "Jonas Ek", email: "jonas@dev.mutu", lat: 59.1961, lng: 17.9095 },
      { name: "Sara Holm", email: "sara@dev.mutu", lat: 59.1929, lng: 17.8987 },
    ];

    const ids: Id<"users">[] = [];
    for (const u of users) {
      const { user } = await createAccount(ctx, {
        provider: "password",
        account: { id: u.email, secret: "mutu1234" },
        profile: { email: u.email, name: u.name } as never,
      });
      ids.push(user._id as Id<"users">);
    }

    await ctx.runMutation(internal.seed.fillData, {
      userIds: ids,
      users,
    });
    return "Seedat! Logga in som berit@dev.mutu / jonas@dev.mutu / sara@dev.mutu med lösenord mutu1234. Gå med via /join/dev-grannar eller /join/dev-vanner.";
  },
});

export const checkSeeded = internalMutation({
  args: {},
  handler: async (ctx) => {
    const berit = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "berit@dev.mutu"))
      .unique();
    return berit !== null;
  },
});

export const fillData = internalMutation({
  args: {
    userIds: v.array(v.id("users")),
    users: v.array(
      v.object({
        name: v.string(),
        email: v.string(),
        lat: v.number(),
        lng: v.number(),
      }),
    ),
  },
  handler: async (ctx, { userIds, users }) => {
    const [berit, jonas, sara] = userIds;
    const today = todayISO();

    // Profiler: adress + koordinater + onboarded
    for (let i = 0; i < userIds.length; i++) {
      await ctx.db.patch(userIds[i], {
        addressText: `Björkvägen ${3 + i * 4}, Tullinge`,
        lat: users[i].lat,
        lng: users[i].lng,
        onboardedAt: Date.now(),
      });
    }

    // Skjul
    const grannar = await ctx.db.insert("sheds", {
      name: "Grannar",
      colorIdx: 1,
      createdBy: berit,
    });
    const vanner = await ctx.db.insert("sheds", {
      name: "Vänner",
      colorIdx: 0,
      createdBy: sara,
    });
    for (const userId of userIds) {
      await ctx.db.insert("shedMembers", {
        shedId: grannar,
        userId,
        role: userId === berit ? "owner" : "member",
      });
    }
    await ctx.db.insert("shedMembers", { shedId: vanner, userId: sara, role: "owner" });
    await ctx.db.insert("shedMembers", { shedId: vanner, userId: jonas, role: "member" });

    // Fasta dev-tokens för att enkelt gå med från riktiga konton
    const farFuture = Date.now() + 365 * 24 * 3600 * 1000;
    await ctx.db.insert("shedInvites", {
      shedId: grannar,
      token: "dev-grannar",
      createdBy: berit,
      expiresAt: farFuture,
    });
    await ctx.db.insert("shedInvites", {
      shedId: vanner,
      token: "dev-vanner",
      createdBy: sara,
      expiresAt: farFuture,
    });

    // Saker
    const insertItem = async (
      ownerId: Id<"users">,
      name: string,
      description: string,
      sheds: Id<"sheds">[],
    ) => {
      const itemId = await ctx.db.insert("items", {
        ownerId,
        name,
        description,
      });
      for (const shedId of sheds) {
        await ctx.db.insert("itemShares", { itemId, shedId });
      }
      return itemId;
    };

    const stege = await insertItem(
      berit,
      "Utskjutsstege 6 m",
      "Lättviktsstege i aluminium. Räcker till takrännan på ett normalt hus.",
      [grannar],
    );
    await insertItem(
      berit,
      "Symaskin",
      "Husqvarna Viking. Nyservad, syr det mesta.",
      [grannar],
    );
    const hogtryck = await insertItem(
      jonas,
      "Högtryckstvätt",
      "Kärcher K5. Slang 8 m, terrassmunstycke följer med.",
      [grannar, vanner],
    );
    await insertItem(
      jonas,
      "Slagborrmaskin",
      "Bosch Professional 18 V. Två batterier och laddare följer med.",
      [grannar],
    );
    await insertItem(
      sara,
      "Cykelkärra",
      "Thule Chariot. Funkar som joggingvagn också.",
      [vanner],
    );
    await insertItem(
      sara,
      "Partytält 3×6 m",
      "Vitt partytält, alla väggar finns. Packas i två väskor.",
      [grannar, vanner],
    );

    // Ett pågående lån (Sara lånar Berits stege) + en öppen förfrågan
    const loan = await ctx.db.insert("loans", {
      itemId: stege,
      borrowerId: sara,
      ownerId: berit,
      startDay: addDays(today, -2),
      endDay: addDays(today, 2),
      status: "approved",
    });
    await ctx.db.insert("messages", { loanId: loan, kind: "system", body: "Förfrågan skickad" });
    await ctx.db.insert("messages", {
      loanId: loan,
      senderId: sara,
      kind: "text",
      body: "Hej Berit! Ska rensa hängrännorna i helgen — lånar gärna stegen.",
    });
    await ctx.db.insert("messages", {
      loanId: loan,
      senderId: sara,
      kind: "period",
      body: "Önskad period",
      proposalStart: addDays(today, -2),
      proposalEnd: addDays(today, 2),
    });
    await ctx.db.insert("messages", {
      loanId: loan,
      kind: "proposal",
      body: "Godkänt",
      proposalStart: addDays(today, -2),
      proposalEnd: addDays(today, 2),
      proposalState: "accepted",
    });

    const req = await ctx.db.insert("loans", {
      itemId: hogtryck,
      borrowerId: berit,
      ownerId: jonas,
      startDay: addDays(today, 5),
      endDay: addDays(today, 7),
      status: "pending",
    });
    await ctx.db.insert("messages", { loanId: req, kind: "system", body: "Förfrågan skickad" });
    await ctx.db.insert("messages", {
      loanId: req,
      senderId: berit,
      kind: "text",
      body: "Hej Jonas! Altanen behöver en omgång — får jag låna tvätten över helgen?",
    });
    await ctx.db.insert("messages", {
      loanId: req,
      senderId: berit,
      kind: "period",
      body: "Önskad period",
      proposalStart: addDays(today, 5),
      proposalEnd: addDays(today, 7),
    });
  },
});
