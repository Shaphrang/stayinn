//src\components\public\home\CategoryGrid.tsx
import Link from "next/link";
import {
  BedDouble,
  Building2,
  Grid2X2,
  Home,
  Hotel,
  Landmark,
  Sparkles,
  TentTree,
} from "lucide-react";
import type { HomeData } from "./types";

type CategoryItem = {
  label: string;
  value: string;
  href?: string;
};

const fallbackCategories: CategoryItem[] = [
  { label: "Homestay", value: "homestay" },
  { label: "Resort", value: "resort" },
  { label: "Guest House", value: "guest_house" },
  { label: "Hotel", value: "hotel" },
  { label: "Cottage", value: "cottage" },
  { label: "Camping", value: "camping" },
  { label: "Villa", value: "villa" },
  { label: "All Stays", value: "all", href: "/stays" },
];

const categoryStyles = [
  {
    icon: "from-[#00a99d] to-[#07877e]",
    glow: "shadow-teal-900/18",
    ring: "ring-teal-100",
  },
  {
    icon: "from-[#ff6f52] to-[#ff4d43]",
    glow: "shadow-orange-900/18",
    ring: "ring-orange-100",
  },
  {
    icon: "from-[#ffb22e] to-[#f59e0b]",
    glow: "shadow-amber-900/16",
    ring: "ring-amber-100",
  },
  {
    icon: "from-[#7c5cff] to-[#6d5dfc]",
    glow: "shadow-indigo-900/16",
    ring: "ring-indigo-100",
  },
  {
    icon: "from-[#fb7185] to-[#f43f5e]",
    glow: "shadow-rose-900/16",
    ring: "ring-rose-100",
  },
  {
    icon: "from-[#14b8a6] to-[#0d9488]",
    glow: "shadow-teal-900/16",
    ring: "ring-teal-100",
  },
  {
    icon: "from-[#22c55e] to-[#16a34a]",
    glow: "shadow-green-900/16",
    ring: "ring-green-100",
  },
  {
    icon: "from-[#111827] to-[#334155]",
    glow: "shadow-slate-900/18",
    ring: "ring-slate-200",
  },
];

function prettyLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getHref(category: CategoryItem) {
  if (category.href) return category.href;
  return `/stays?propertyType=${encodeURIComponent(category.value)}`;
}

function CategoryIcon({ label }: { label: string }) {
  const lower = label.toLowerCase();

  if (lower.includes("home")) return <Home className="h-6 w-6" />;
  if (lower.includes("resort")) return <Sparkles className="h-6 w-6" />;
  if (lower.includes("guest")) return <Building2 className="h-6 w-6" />;
  if (lower.includes("hotel")) return <Hotel className="h-6 w-6" />;
  if (lower.includes("cottage")) return <BedDouble className="h-6 w-6" />;
  if (lower.includes("camp")) return <TentTree className="h-6 w-6" />;
  if (lower.includes("villa")) return <Landmark className="h-6 w-6" />;

  return <Grid2X2 className="h-6 w-6" />;
}

export function CategoryGrid({ data }: { data: HomeData }) {
  const dbCategories: CategoryItem[] = data.categories.length
    ? data.categories.map((category) => ({
        label: category.label,
        value: category.value,
      }))
    : [];

  const mergedCategories = [...fallbackCategories];

  for (const category of dbCategories) {
    const exists = mergedCategories.some(
      (item) =>
        item.value.toLowerCase() === category.value.toLowerCase() ||
        item.label.toLowerCase() === category.label.toLowerCase()
    );

    if (!exists) mergedCategories.splice(mergedCategories.length - 1, 0, category);
  }

  const categories = mergedCategories.slice(0, 8);

  return (
    <section className="px-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-black tracking-[-0.035em] text-slate-950">
            Browse by category
          </h2>
          <p className="mt-0.5 text-[11px] font-bold text-slate-500">
            Find the perfect stay type
          </p>
        </div>

        <Link href="/stays" className="text-[12px] font-black text-[#07877e]">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-x-2 gap-y-3.5">
        {categories.map((category, index) => {
          const style = categoryStyles[index % categoryStyles.length];
          const label = prettyLabel(category.label);

          return (
            <Link
              key={`${category.value}-${index}`}
              href={getHref(category)}
              className="group flex min-w-0 flex-col items-center text-center active:scale-[0.96]"
            >
              <span
                className={[
                  "relative grid h-[50px] w-[50px] place-items-center overflow-hidden rounded-[18px] bg-gradient-to-br text-white shadow-lg ring-1 ring-white/80 transition group-active:scale-95",
                  style.icon,
                  style.glow,
                ].join(" ")}
              >
                <span className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-white/20 blur-sm" />
                <span className="absolute bottom-1 left-1 h-2 w-2 rounded-full bg-white/22" />

                <span className="relative z-10">
                  <CategoryIcon label={category.label} />
                </span>
              </span>

              <span className="mt-1.5 flex min-h-[28px] w-full items-start justify-center px-0.5">
                <span className="line-clamp-2 text-[11px] font-black leading-[13px] tracking-[-0.015em] text-slate-800">
                  {label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}