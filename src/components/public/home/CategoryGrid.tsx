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
  "from-[#0f9f9a] to-[#7dd3fc] text-white shadow-teal-900/20",
  "from-[#f59e0b] to-[#fb7185] text-white shadow-orange-900/20",
  "from-[#6366f1] to-[#a855f7] text-white shadow-indigo-900/20",
  "from-[#10b981] to-[#84cc16] text-white shadow-emerald-900/20",
  "from-[#ef4444] to-[#f97316] text-white shadow-red-900/20",
  "from-[#14b8a6] to-[#0f766e] text-white shadow-teal-900/20",
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

      <div className="grid grid-cols-3 gap-y-3">
        {cats.slice(0, 6).map((cat, index) => (
          <Link
            key={cat.value}
            href={`/stays?propertyType=${encodeURIComponent(cat.value)}`}
            className="flex flex-col items-center text-center active:scale-[0.97]"
          >
            <div
              className={[
                "grid h-[54px] w-[54px] place-items-center rounded-[22px] bg-gradient-to-br shadow-lg ring-1 ring-white/45",
                tones[index % tones.length],
              ].join(" ")}
            >
              <CategoryIcon label={cat.label} />
            </div>

            <p className="mt-2 line-clamp-2 min-h-[28px] max-w-[92px] text-[11px] font-black leading-[14px] text-slate-800">
              {cat.label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}