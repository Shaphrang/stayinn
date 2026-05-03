import Link from "next/link";
import type { StayItem } from "./types";
import { StayCard } from "./StayCard";
import { CompactStayCard } from "./CompactStayCard";

export function StaySection({ title, items, viewAllHref, compact = false }: { title: string; items: StayItem[]; viewAllHref: string; compact?: boolean }) {
  if (!items.length) return null;
  return <section className="mt-6 px-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-4xl font-serif text-slate-800">{title}</h3><Link href={viewAllHref} className="text-[#14aaa6]">View all</Link></div><div className="flex gap-3 overflow-x-auto pb-1">{items.map((stay) => compact ? <CompactStayCard key={stay.id} stay={stay} /> : <StayCard key={stay.id} stay={stay} />)}</div></section>;
}
