import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const loanStatus = v.union(
  v.literal("pending"), // förfrågan skickad, väntar på ägaren
  v.literal("proposed"), // ägaren har motföreslagit datum
  v.literal("approved"), // godkänt (pågår/försenad härleds ur datum i UI)
  v.literal("returned"),
  v.literal("declined"),
  v.literal("cancelled"),
);

export default defineSchema({
  ...authTables,

  users: defineTable({
    // Convex Auth-fält
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Mutu-profil (sätts under onboarding)
    addressText: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    onboardedAt: v.optional(v.number()),
  }).index("email", ["email"]),

  sheds: defineTable({
    name: v.string(),
    colorIdx: v.number(), // 0–4 → fast dov palett
    createdBy: v.id("users"),
  }),

  shedMembers: defineTable({
    shedId: v.id("sheds"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member")),
  })
    .index("by_shed", ["shedId"])
    .index("by_user", ["userId"])
    .index("by_shed_user", ["shedId", "userId"]),

  shedInvites: defineTable({
    shedId: v.id("sheds"),
    token: v.string(),
    createdBy: v.id("users"),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_shed", ["shedId"]),

  items: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
  }).index("by_owner", ["ownerId"]),

  // Delningsmatrisens sanning: en rad = "saken delas i skjulet"
  itemShares: defineTable({
    itemId: v.id("items"),
    shedId: v.id("sheds"),
  })
    .index("by_item", ["itemId"])
    .index("by_shed", ["shedId"])
    .index("by_item_shed", ["itemId", "shedId"]),

  loans: defineTable({
    itemId: v.id("items"),
    borrowerId: v.id("users"),
    ownerId: v.id("users"), // denormaliserad för indexerade listor
    startDay: v.string(), // ISO-datum "2026-07-10", hela dagar
    endDay: v.string(),
    status: loanStatus,
    returnedAt: v.optional(v.number()),
  })
    .index("by_borrower", ["borrowerId"])
    .index("by_owner", ["ownerId"])
    .index("by_item", ["itemId"]),

  messages: defineTable({
    loanId: v.id("loans"),
    senderId: v.optional(v.id("users")), // null/undefined = systemnotis
    kind: v.union(
      v.literal("text"),
      v.literal("system"),
      v.literal("period"),
      v.literal("proposal"),
    ),
    body: v.string(),
    proposalStart: v.optional(v.string()),
    proposalEnd: v.optional(v.string()),
    proposalState: v.optional(
      v.union(v.literal("open"), v.literal("accepted"), v.literal("hidden")),
    ),
  }).index("by_loan", ["loanId"]),

  loanReads: defineTable({
    loanId: v.id("loans"),
    userId: v.id("users"),
    lastReadAt: v.number(),
  }).index("by_user_loan", ["userId", "loanId"]),
});
