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
  const berit = await t.run(async (ctx) =>
    ctx.db.insert("users", { name: "Berit Lindgren", email: "berit@test" }),
  );
  return { t, berit };
}

const asUser = (t: ReturnType<typeof convexTest>, userId: Id<"users">) =>
  t.withIdentity({ subject: `${userId}|session` });

describe("plats", () => {
  it("setLocation avrundar till 3 decimaler", async () => {
    const { t, berit } = await setup();
    await asUser(t, berit).mutation(api.users.setLocation, {
      lat: 59.19534,
      lng: 17.90417,
    });
    const user = await t.run(async (ctx) => ctx.db.get(berit));
    expect(user?.lat).toBe(59.195);
    expect(user?.lng).toBe(17.904);
  });

  it("setLocation avvisar ogiltiga koordinater", async () => {
    const { t, berit } = await setup();
    await expect(
      asUser(t, berit).mutation(api.users.setLocation, { lat: 91, lng: 0 }),
    ).rejects.toThrow("Ogiltig position");
    await expect(
      asUser(t, berit).mutation(api.users.setLocation, { lat: 59, lng: 181 }),
    ).rejects.toThrow("Ogiltig position");
  });

  it("setLocation kräver inloggning", async () => {
    const { t } = await setup();
    await expect(
      t.mutation(api.users.setLocation, { lat: 59.195, lng: 17.904 }),
    ).rejects.toThrow();
  });

  it("onboarding kräver plats", async () => {
    const { t, berit } = await setup();
    await expect(
      asUser(t, berit).mutation(api.users.completeOnboarding, {}),
    ).rejects.toThrow("Plats saknas");

    await asUser(t, berit).mutation(api.users.setLocation, {
      lat: 59.195,
      lng: 17.904,
    });
    await asUser(t, berit).mutation(api.users.completeOnboarding, {});

    const viewer = await asUser(t, berit).query(api.users.viewer, {});
    expect(viewer?.onboarded).toBe(true);
    expect(viewer?.lat).toBe(59.195);
    expect(viewer?.lng).toBe(17.904);
    expect(viewer).not.toHaveProperty("addressText");
  });
});
