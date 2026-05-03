import Link from "next/link";
import type { HomeData } from "./types";

export function CategoryGrid({ data }: { data: HomeData }) {
  const cats = data.categories.length ? data.categories : [{ label: "Resorts", value: "resorts" }, { label: "Homestays", value: "homestays" }, { label: "Villas", value: "villas" }, { label: "Cabins", value: "cabins" }];
  return <section className="mt-4 grid grid-cols-3 gap-3 px-4">{cats.slice(0, 6).map((cat) => <Link key={cat.value} href={`/stays?propertyType=${encodeURIComponent(cat.value)}`} className="rounded-2xl bg-white p-3 text-center shadow-sm"><div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center text-[#0f9f9a]">🏨</div><p className="text-sm font-medium text-slate-700">{cat.label}</p></Link>)}</section>;
}
