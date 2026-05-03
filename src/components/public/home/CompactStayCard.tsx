import Link from "next/link";
import Image from "next/image";
import type { StayItem } from "./types";

export function CompactStayCard({ stay }: { stay: StayItem }) {
  return <Link href={`/stays/${stay.slug}`} className="min-w-[240px] overflow-hidden rounded-2xl bg-white shadow-sm"><div className="flex"><Image src={stay.coverImageUrl} alt={stay.name} width={120} height={120} className="h-28 w-28 object-cover" unoptimized /><div className="p-2"><p className="line-clamp-1 font-medium text-slate-800">{stay.name}</p><p className="text-sm text-slate-500">{stay.locality || stay.district}</p><p className="mt-1 font-semibold">₹{stay.priceFrom.toLocaleString()}</p></div></div></Link>;
}
