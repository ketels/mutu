"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { MobileHeader } from "@/components/nav/MobileHeader";
import { ItemCard } from "@/components/items/ItemCard";
import { ItemDetail } from "@/components/items/ItemDetail";
import { Chip } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";

export default function UtforskaPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Id<"sheds"> | null>(null);
  const [openItemId, setOpenItemId] = useState<Id<"items"> | null>(null);

  const sheds = useQuery(api.sheds.list);
  const feed = useQuery(api.explore.feed, {
    search: query || undefined,
    shedId: filter ?? undefined,
  });

  return (
    <div>
      <MobileHeader logo />
      <div className="px-6 pt-6 md:px-0 md:pt-10">
        <h1 className="heading text-[26px] leading-tight md:text-[34px]">
          Låna av folk <br className="md:hidden" />
          du litar på
        </h1>
        <p className="mt-1.5 text-[14.5px] text-muted">
          {feed
            ? `${feed.total} ${feed.total === 1 ? "sak" : "saker"} i dina skjul just nu`
            : " "}
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
            active={filter === null}
            onClick={() => setFilter(null)}
          />
          {sheds?.map((s) => (
            <Chip
              key={s._id}
              label={s.name}
              colorIdx={s.colorIdx}
              active={filter === s._id}
              onClick={() => setFilter(filter === s._id ? null : s._id)}
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-3.5 gap-y-7 md:grid-cols-4 md:gap-x-6">
          {feed?.items.map((it) => (
            <ItemCard
              key={it._id}
              name={it.name}
              photoUrl={it.photoUrl}
              colorIdx={it.shedColorIdx}
              meta={`${it.ownerFirst}${it.distance ? ` · ${it.distance}` : ""} · ${it.available ? "ledig" : "utlånad"}`}
              onClick={() => setOpenItemId(it._id)}
            />
          ))}
        </div>

        {feed?.items.length === 0 && (
          <p className="mt-10 text-center text-[14.5px] text-muted">
            {query || filter
              ? "Inget matchade din sökning."
              : "Här är det tomt än. Gå med i ett skjul, eller bjud in folk till dina — sakerna dyker upp här."}
          </p>
        )}
      </div>

      <Sheet open={openItemId !== null} onClose={() => setOpenItemId(null)}>
        {openItemId && <ItemDetail itemId={openItemId} />}
      </Sheet>
    </div>
  );
}
