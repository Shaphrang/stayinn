//src\components\public\home\CategoryChips.tsx
import Link from "next/link";
import type { HomeData } from "./types";

const fallback = [
  "Resorts",
  "Homestays",
  "Guesthouses",
  "Hotels",
  "Villas",
  "Camping",
];

export function CategoryChips({ data }: { data: HomeData }) {
  const cats = data.categories.length
    ? data.categories.map((c) => c.label)
    : fallback;

  return (
    <section className="px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-black tracking-tight text-slate-950">
          Quick filters
        </h2>

        <Link href="/stays" className="text-[12px] font-black text-[#0f9f9a]">
          View all
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {["All", ...cats].slice(0, 9).map((cat, index) => {
          const active = index === 0;

          return (
            <Link
              key={cat}
              href={
                active
                  ? "/stays"
                  : `/stays?propertyType=${encodeURIComponent(cat)}`
              }
              className={[
                "shrink-0 rounded-full px-4 py-2 text-[12px] font-black transition active:scale-95",
                active
                  ? "bg-gradient-to-r from-[#0f766e] to-[#0f9f9a] text-white shadow-sm shadow-teal-900/15"
                  : "bg-[#fff3df] text-[#7c4a03] ring-1 ring-orange-100",
              ].join(" ")}
            >
              {cat}
            </Link>
          );
        })}
      </div>
    </section>
  );
}