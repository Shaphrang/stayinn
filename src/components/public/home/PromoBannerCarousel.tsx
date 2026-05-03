import Link from "next/link";
import Image from "next/image";
import type { HomeData } from "./types";

export function PromoBannerCarousel({ data }: { data: HomeData }) {
  const banners = data.banners.length ? data.banners : [{ id: "fallback", title: "Monsoon Escapes", subtitle: "Rainy days. Cozy stays.", imageUrl: "", buttonLabel: "Explore Deals", linkType: "search", linkValue: null }];
  return <section className="mt-6 overflow-x-auto px-4"><div className="flex gap-3">{banners.slice(0, 3).map((b) => <Link key={b.id} href={b.linkValue || "/stays"} className="relative min-w-full overflow-hidden rounded-3xl bg-[#d8f1ef] p-6">{b.imageUrl ? <Image src={b.imageUrl} alt={b.title} width={900} height={360} className="absolute inset-0 h-full w-full object-cover" unoptimized /> : null}<div className="absolute inset-0 bg-gradient-to-r from-[#fffaf3f2] to-transparent" /><div className="relative"><h3 className="text-5xl font-serif text-[#0d7f7b]">{b.title}</h3><p className="mt-2 text-slate-600">{b.subtitle}</p><span className="mt-4 inline-block rounded-xl bg-[#14aaa6] px-4 py-2 text-white">{b.buttonLabel || "Explore"}</span></div></Link>)}</div></section>;
}
