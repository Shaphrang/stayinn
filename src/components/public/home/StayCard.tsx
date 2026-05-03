import Image from "next/image";
import Link from "next/link";
import type { StayItem } from "./types";

export function StayCard({ stay }: { stay: StayItem }) {
  return <Link href={`/stays/${stay.slug}`} className="min-w-[280px] overflow-hidden rounded-3xl bg-white shadow-sm"><Image src={stay.coverImageUrl} alt={stay.name} width={360} height={240} className="h-40 w-full object-cover" unoptimized /><div className="p-3"><p className="line-clamp-1 font-semibold text-slate-800">{stay.name}</p><p className="text-sm text-slate-500">{stay.addressLabel}</p><p className="mt-1 font-semibold text-slate-800">₹{stay.priceFrom.toLocaleString()} <span className="font-normal text-slate-500">/ night</span></p></div></Link>;
}
