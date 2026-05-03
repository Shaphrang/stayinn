import Link from "next/link";
import type { HomeData } from "./types";

const fallback = ["Resorts", "Homestays", "Boutique Hotels", "Villas", "Cabins", "Camping"];

export function CategoryChips({ data }: { data: HomeData }) {
  const cats = data.categories.length ? data.categories.map((c) => c.label) : fallback;
  return <div className="mt-5 flex gap-2 overflow-x-auto px-4 pb-1">{["All", ...cats].slice(0, 8).map((c, i) => <Link key={c} href={i === 0 ? "/stays" : `/stays?propertyType=${encodeURIComponent(c)}`} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${i === 0 ? "bg-[#14aaa6] text-white" : "bg-[#fff4e8] text-[#6f5a3a]"}`}>{c}</Link>)}</div>;
}
