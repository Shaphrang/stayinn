//src\components\public\home\CategoryGrid.tsx
import Link from "next/link";
import {
  Building2,
  Home,
  Hotel,
  Landmark,
  Sparkles,
  TentTree,
} from "lucide-react";
import type { HomeData } from "./types";

const fallback = [
  { label: "Resorts", value: "resorts" },
  { label: "Homestays", value: "homestays" },
  { label: "Guesthouses", value: "guesthouses" },
  { label: "Hotels", value: "hotels" },
  { label: "Villas", value: "villas" },
  { label: "Camping", value: "camping" },
];

const tones = [
  "from-[#e9fbf8] to-[#d7f7ef] text-[#0f9f9a]",
  "from-[#fff3df] to-[#ffe2ae] text-[#b86b00]",
  "from-[#eef2ff] to-[#dde5ff] text-[#4f46e5]",
  "from-[#fef2f2] to-[#ffe4e6] text-[#e11d48]",
  "from-[#f0fdf4] to-[#dcfce7] text-[#16a34a]",
  "from-[#faf5ff] to-[#f3e8ff] text-[#9333ea]",
];

function CategoryIcon({ label }: { label: string }) {
  const lower = label.toLowerCase();

  if (lower.includes("home")) return <Home className="h-6 w-6" />;
  if (lower.includes("villa")) return <Landmark className="h-6 w-6" />;
  if (lower.includes("camp")) return <TentTree className="h-6 w-6" />;
  if (lower.includes("guest")) return <Building2 className="h-6 w-6" />;
  if (lower.includes("hotel")) return <Hotel className="h-6 w-6" />;

  return <Sparkles className="h-6 w-6" />;
}

export function CategoryGrid({ data }: { data: HomeData }) {
  const cats = data.categories.length ? data.categories : fallback;

  return (
    <section className="px-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-[15px] font-black tracking-tight text-slate-950">
            Explore types
          </h2>
          <p className="mt-0.5 text-[12px] font-semibold text-slate-500">
            Choose your stay mood
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {cats.slice(0, 6).map((cat, index) => (
          <Link
            key={cat.value}
            href={`/stays?propertyType=${encodeURIComponent(cat.value)}`}
            className="rounded-[24px] bg-white px-2.5 py-3 text-center shadow-sm ring-1 ring-slate-200/75 active:scale-[0.98]"
          >
            <div
              className={[
                "mx-auto mb-2 grid h-12 w-12 place-items-center rounded-[20px] bg-gradient-to-br shadow-inner",
                tones[index % tones.length],
              ].join(" ")}
            >
              <CategoryIcon label={cat.label} />
            </div>

            <p className="line-clamp-2 min-h-[28px] text-[11px] font-black leading-[14px] text-slate-800">
              {cat.label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}