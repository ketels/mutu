// Mockdata för E0-skalet, hämtad ur prototypens seed. Ersätts av Convex i E1+.

export type MockShed = {
  id: string;
  name: string;
  colorIdx: number;
  members: string[];
  metaBase: string;
};

export const MOCK_SHEDS: MockShed[] = [
  { id: "v", name: "Vänner", colorIdx: 0, members: ["JS", "MA", "LK", "EB", "PN", "AS"], metaBase: "6 personer" },
  { id: "g", name: "Grannar", colorIdx: 1, members: ["AB", "JL", "BJ", "MK", "SO", "TH", "KV", "RD", "FL", "GM", "HN"], metaBase: "11 personer på Björkvägen" },
  { id: "f", name: "Familjen", colorIdx: 2, members: ["MÖ", "GÖ", "TÖ", "EÖ"], metaBase: "4 personer" },
];

export type MockItem = {
  id: number;
  name: string;
  owner: string;
  shedId: string;
  dist: string;
  available: boolean;
};

export const MOCK_ITEMS: MockItem[] = [
  { id: 1, name: "Slagborrmaskin", owner: "Johan", shedId: "g", dist: "300 m", available: true },
  { id: 2, name: "Utskjutsstege 6 m", owner: "Berit", shedId: "g", dist: "450 m", available: true },
  { id: 3, name: "Högtryckstvätt", owner: "Marcus", shedId: "v", dist: "200 m", available: false },
  { id: 4, name: "Symaskin", owner: "Lena", shedId: "v", dist: "1,2 km", available: true },
  { id: 5, name: "Skottkärra", owner: "Amira", shedId: "g", dist: "150 m", available: false },
  { id: 6, name: "Häcksax", owner: "Per", shedId: "g", dist: "100 m", available: true },
  { id: 7, name: "Cykelkärra", owner: "Sara", shedId: "v", dist: "600 m", available: true },
  { id: 8, name: "Partytält 3×6 m", owner: "Fam. Öberg", shedId: "f", dist: "2 km", available: true },
];

export function mockShed(id: string) {
  return MOCK_SHEDS.find((s) => s.id === id)!;
}
