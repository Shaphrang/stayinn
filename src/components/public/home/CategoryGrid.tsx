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

function CategoryIcon({ label }: { label: string }) {
  const lower = label.toLowerCase();

  if (lower.includes("home")) return <Home className="h-5 w-5" />;
  if (lower.includes("villa")) return <Landmark className="h-5 w-5" />;
  if (lower.includes("camp")) return <TentTree className="h-5 w-5" />;
  if (lower.includes("guest")) return <Building2 className="h-5 w-5" />;
  if (lower.includes("hotel")) return <Hotel className="h-5 w-5" />;

  return <Sparkles className="h-5 w-5" />;
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
          <p className="mt-0.5 text-[12px] font-medium text-slate-500">
            Choose how you want to stay
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {cats.slice(0, 6).map((cat) => (
          <Link
            key={cat.value}
            href={`/stays?propertyType=${encodeURIComponent(cat.value)}`}
            className="group rounded-[22px] bg-white p-3 shadow-sm ring-1 ring-slate-200/70 active:scale-[0.98]"
          >
            <div className="mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-[#e9fbf8] text-[#0f9f9a] transition group-active:scale-95">
              <CategoryIcon label={cat.label} />
            </div>

            <p className="line-clamp-2 min-h-[30px] text-[12px] font-extrabold leading-[15px] text-slate-800">
              {cat.label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}