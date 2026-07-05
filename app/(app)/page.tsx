"use client";

import { useState } from "react";
import { MobileHeader } from "@/components/nav/MobileHeader";
import { ItemCard } from "@/components/items/ItemCard";
import { Chip } from "@/components/ui/Chip";
import { MOCK_ITEMS, MOCK_SHEDS, mockShed } from "@/lib/mock";

export default function UtforskaPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("alla");

  const visible = MOCK_ITEMS.filter(
    (it) =>
      (filter === "alla" || it.shedId === filter) &&
      (!query || it.name.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div>
      <MobileHeader logo />
      <div className="px-6 pt-4 md:px-0 md:pt-10">
        <h1 className="heading text-[26px] leading-tight md:text-[34px]">
          Låna av folk du litar på.
        </h1>
        <p className="mt-1.5 text-[14.5px] text-muted">
          {MOCK_ITEMS.length} saker i dina skjul just nu
        </p>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök stege, symaskin, släpkärra…"
          className="mt-5 w-full rounded-field border border-border bg-card px-[15px] py-[13px] text-[14.5px] placeholder:text-faint outline-none focus:border-ink md:max-w-80"
        />

        <div className="scrollbar-none -mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-1 md:mx-0 md:px-0">
          <Chip
            label="Alla skjul"
            active={filter === "alla"}
            onClick={() => setFilter("alla")}
          />
          {MOCK_SHEDS.map((s) => (
            <Chip
              key={s.id}
              label={s.name}
              colorIdx={s.colorIdx}
              active={filter === s.id}
              onClick={() => setFilter(s.id)}
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-3.5 gap-y-7 md:grid-cols-4 md:gap-x-6">
          {visible.map((it) => (
            <ItemCard
              key={it.id}
              name={it.name}
              colorIdx={mockShed(it.shedId).colorIdx}
              meta={`${it.owner} · ${it.dist} · ${it.available ? "ledig" : "utlånad"}`}
            />
          ))}
        </div>

        {visible.length === 0 && (
          <p className="mt-10 text-center text-[14.5px] text-muted">
            Inget matchade din sökning.
          </p>
        )}
      </div>
    </div>
  );
}
