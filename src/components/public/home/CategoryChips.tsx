//src\components\public\home\CategoryChips.tsx
import Link from "next/link";
import type { HomeData } from "./types";

const fallback = ["Homestay", "Resort", "Guest House", "Hotel", "Cottage", "Camping"];

function prettyLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function CategoryChips({ data }: { data: HomeData }) {
  const cats = data.categories.length
    ? data.categories.map((category) => category.label)
    : fallback;

  return (
    <section className="px-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-black tracking-tight text-slate-950">
          Quick filters
        </h2>

        <Link href="/stays" className="text-[12px] font-black text-[#07877e]">
          View all
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {["All", ...cats].slice(0, 9).map((category, index) => {
          const active = index === 0;

          return (
            <Link
              key={`${category}-${index}`}
              href={
                active
                  ? "/stays"
                  : `/stays?propertyType=${encodeURIComponent(category)}`
              }
              className={[
                "shrink-0 rounded-full px-4 py-2 text-[12px] font-black shadow-sm transition active:scale-95",
                active
                  ? "bg-gradient-to-br from-[#00a99d] to-[#07877e] text-white"
                  : "bg-[#fff7ea] text-[#704209] ring-1 ring-orange-100",
              ].join(" ")}
            >
              {active ? "All" : prettyLabel(category)}
            </Link>
          );
        })}
      </div>
    </section>
  );
}