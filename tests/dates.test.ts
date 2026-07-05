import { describe, expect, it } from "vitest";
import {
  addDays,
  daysInRange,
  isValidISODate,
  rangesOverlap,
} from "../convex/lib/dates";
import { distanceMeters, formatDistance } from "../convex/lib/geo";
import { fmtRangeSv } from "../convex/lib/format";

describe("rangesOverlap", () => {
  it("upptäcker överlapp", () => {
    expect(rangesOverlap("2026-07-10", "2026-07-12", "2026-07-12", "2026-07-14")).toBe(true);
    expect(rangesOverlap("2026-07-10", "2026-07-12", "2026-07-05", "2026-07-10")).toBe(true);
    expect(rangesOverlap("2026-07-10", "2026-07-12", "2026-07-11", "2026-07-11")).toBe(true);
  });
  it("släpper igenom fria perioder", () => {
    expect(rangesOverlap("2026-07-10", "2026-07-12", "2026-07-13", "2026-07-15")).toBe(false);
    expect(rangesOverlap("2026-07-10", "2026-07-12", "2026-07-01", "2026-07-09")).toBe(false);
  });
});

describe("daysInRange", () => {
  it("räknar inklusivt", () => {
    expect(daysInRange("2026-07-10", "2026-07-10")).toBe(1);
    expect(daysInRange("2026-07-10", "2026-07-12")).toBe(3);
  });
  it("klarar månadsskifte", () => {
    expect(daysInRange("2026-07-30", "2026-08-02")).toBe(4);
  });
});

describe("addDays", () => {
  it("adderar över månadsskifte", () => {
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDays("2026-07-01", -1)).toBe("2026-06-30");
  });
});

describe("isValidISODate", () => {
  it("godkänner riktiga datum", () => {
    expect(isValidISODate("2026-07-05")).toBe(true);
  });
  it("avvisar skräp", () => {
    expect(isValidISODate("2026-02-30")).toBe(false);
    expect(isValidISODate("igår")).toBe(false);
    expect(isValidISODate("2026-7-5")).toBe(false);
  });
});

describe("formatDistance", () => {
  it("avrundar grovt under en kilometer", () => {
    expect(formatDistance(283)).toBe("300 m");
    expect(formatDistance(12)).toBe("50 m");
  });
  it("kilometer med decimal och svenskt kommatecken", () => {
    expect(formatDistance(1234)).toBe("1,2 km");
  });
  it("hela kilometer över 10 km", () => {
    expect(formatDistance(12345)).toBe("12 km");
  });
});

describe("distanceMeters", () => {
  it("ger rimligt grannavstånd", () => {
    // Två punkter ~500 m isär i Tullinge
    const d = distanceMeters(59.1953, 17.9041, 59.1929, 17.8987);
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(700);
  });
});

describe("fmtRangeSv", () => {
  it("formaterar period inom samma månad", () => {
    expect(fmtRangeSv("2026-07-10", "2026-07-12")).toBe("fre 10 → sön 12 juli");
  });
  it("en dag utan pil", () => {
    expect(fmtRangeSv("2026-07-10", "2026-07-10")).toBe("fre 10 juli");
  });
});
