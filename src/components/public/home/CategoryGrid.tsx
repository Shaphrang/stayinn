//src\components\public\home\CategoryGrid.tsx
import Link from "next/link";
import {
  Building2,
  Grid2X2,
  Home,
  Hotel,
  Landmark,
  Palmtree,
  Sparkles,
  TentTree,
} from "lucide-react";
import type { HomeData } from "./types";

const fallback = [
  { label: "Homestay", value: "homestay" },
  { label: "Resort", value: "resort" },
  { label: "Guest House", value: "guest_house" },
  { label: "Hotel", value: "hotel" },
  { label: "Cottage", value: "cottage" },
  { label: "Camping", value: "camping" },
];

const tones = [
  "from-[#00a99d] to-[#07877e]",
  "from-[#ff6f52] to-[#ff4d43]",
  "from-[#f6a72f] to-[#ff8a00]",
  "from-[#ff6f52] to-[#f36b7f]",
  "from-[#13b8a8] to-[#3abf8f]",
  "from-[#07877e] to-[#128b65]",
  "from-[#7c5cff] to-[#8f6bff]",
];

function prettyLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function CategoryIcon({ label }: { label: string }) {
  const lower = label.toLowerCase();

  if (lower.includes("home")) return <Home className="h-6 w-6" />;
  if (lower.includes("resort")) return <Sparkles className="h-6 w-6" />;
  if (lower.includes("guest")) return <Building2 className="h-6 w-6" />;
  if (lower.includes("hotel")) return <Hotel className="h-6 w-6" />;
  if (lower.includes("cottage")) return <Landmark className="h-6 w-6" />;
  if (lower.includes("camp")) return <TentTree className="h-6 w-6" />;
  if (lower.includes("villa")) return <Palmtree className="h-6 w-6" />;

  return <Grid2X2 className="h-6 w-6" />;
}

export function CategoryGrid({ data }: { data: HomeData }) {
  const categories = data.categories.length ? data.categories : fallback;

  return (
    <section className="px-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-black tracking-tight text-slate-950">
            Top categories
          </h2>
          <p className="mt-0.5 text-[12px] font-bold text-slate-500">
            Browse by category
          </p>
        </div>

        <Link href="/stays" className="text-[12px] font-black text-[#07877e]">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {categories.slice(0, 6).map((category, index) => (
          <Link
            key={category.value}
            href={`/stays?propertyType=${encodeURIComponent(category.value)}`}
            className="flex min-w-0 flex-col items-center text-center active:scale-[0.96]"
          >
            <span
              className={[
                "grid h-[46px] w-[46px] place-items-center rounded-[17px] bg-gradient-to-br text-white shadow-lg shadow-slate-900/10 ring-1 ring-white/50",
                tones[index % tones.length],
              ].join(" ")}
            >
              <CategoryIcon label={category.label} />
            </span>

            <span className="mt-1.5 line-clamp-1 w-full text-[10px] font-black text-slate-700">
              {prettyLabel(category.label)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}