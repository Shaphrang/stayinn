//src\components\public\home\CategoryGrid.tsx
import Link from "next/link";
import {
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

const iconTones = [
  "from-[#00a99d] to-[#07877e]",
  "from-[#ff6f52] to-[#ff4d43]",
  "from-[#ffb22e] to-[#f59e0b]",
  "from-[#7c5cff] to-[#6d5dfc]",
  "from-[#ff6257] to-[#f43f5e]",
  "from-[#00a99d] to-[#13b8a8]",
  "from-[#ffb22e] to-[#ff8a00]",
  "from-[#f5f2ea] to-[#ffffff]",
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

  if (lower.includes("home")) return <Home className="h-7 w-7" />;
  if (lower.includes("resort")) return <Sparkles className="h-7 w-7" />;
  if (lower.includes("guest")) return <Building2 className="h-7 w-7" />;
  if (lower.includes("hotel")) return <Hotel className="h-7 w-7" />;
  if (lower.includes("cottage")) return <Sparkles className="h-7 w-7" />;
  if (lower.includes("camp")) return <TentTree className="h-7 w-7" />;
  if (lower.includes("villa")) return <Landmark className="h-7 w-7" />;

  return <Grid2X2 className="h-7 w-7" />;
}

export function CategoryGrid({ data }: { data: HomeData }) {
  const dbCategories: CategoryItem[] = data.categories.length
    ? data.categories.map((category) => ({
        label: category.label,
        value: category.value,
      }))
    : [];

  const mergedCategories = [...dbCategories];

  for (const fallback of fallbackCategories) {
    const exists = mergedCategories.some(
      (item) =>
        item.value.toLowerCase() === fallback.value.toLowerCase() ||
        item.label.toLowerCase() === fallback.label.toLowerCase()
    );

    if (!exists) mergedCategories.push(fallback);
  }

  const categories = mergedCategories.slice(0, 8);

  return (
    <section className="px-4">
      <div className="grid grid-cols-4 gap-x-3 gap-y-5">
        {categories.map((category, index) => {
          const isAll = category.label.toLowerCase().includes("all");

          return (
            <Link
              key={`${category.value}-${index}`}
              href={getHref(category)}
              className="flex min-w-0 flex-col items-center text-center active:scale-[0.96]"
            >
              <span
                className={[
                  "grid h-[54px] w-[54px] place-items-center rounded-[19px] text-white shadow-[0_10px_22px_rgba(15,23,42,0.12)] ring-1 ring-white/70",
                  "bg-gradient-to-br",
                  iconTones[index % iconTones.length],
                  isAll ? "text-slate-700 shadow-sm ring-slate-200" : "",
                ].join(" ")}
              >
                <CategoryIcon label={category.label} />
              </span>

              <span className="mt-2 line-clamp-1 w-full text-[12px] font-black leading-none text-slate-700">
                {prettyLabel(category.label)}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}