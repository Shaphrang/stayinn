import Image from "next/image";
import type { HomeData } from "./types";

export function HeroSection({ data }: { data: HomeData }) {
  const heroImage = data.banners[0]?.imageUrl || data.featuredStays[0]?.coverImageUrl;
  return (
    <section className="relative mx-4 overflow-hidden rounded-[2rem]">
      {heroImage ? <Image src={heroImage} alt="StayInn hero" width={1000} height={600} className="h-[300px] w-full object-cover" unoptimized /> : <div className="h-[300px] w-full bg-gradient-to-r from-[#0f9f9a] via-[#74d1ca] to-[#fff2dd]" />}
      <div className="absolute inset-0 bg-gradient-to-r from-[#fffaf3ee] to-transparent" />
      <div className="absolute left-6 top-8 max-w-[70%]">
        <p className="text-4xl font-serif text-[#d7a85f]">Your escape, perfectly</p>
        <h2 className="text-7xl font-serif leading-none text-[#0b8f8a]">curated</h2>
        <p className="mt-4 text-2xl text-slate-600">{data.hero.subtitle || "Handpicked stays for unforgettable journeys"}</p>
      </div>
    </section>
  );
}
