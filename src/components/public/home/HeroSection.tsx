//src\components\public\home\HeroSection.tsx
import Image from "next/image";
import type { HomeData } from "./types";

function getText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function HeroSection({ data }: { data: HomeData }) {
  const hero = data.hero as Record<string, unknown>;
  const heroImage =
    data.banners[0]?.imageUrl || data.featuredStays[0]?.coverImageUrl;

  const title = getText(hero.title, "Find your perfect stay");
  const subtitle = getText(
    hero.subtitle,
    "Book resorts, homestays, guesthouses and peaceful escapes."
  );

  return (
    <section className="px-4 pt-3">
      <div className="relative h-[205px] overflow-hidden rounded-[28px] bg-slate-900 shadow-sm">
        {heroImage ? (
          <Image
            src={heroImage}
            alt="StayInn stays"
            width={900}
            height={520}
            priority
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,#99f6e4,transparent_32%),linear-gradient(135deg,#0f9f9a,#0f766e_48%,#111827)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="mb-3 inline-flex rounded-full bg-white/18 px-3 py-1 text-[11px] font-semibold text-white ring-1 ring-white/25 backdrop-blur-md">
            Native PWA stays experience
          </div>

          <h1 className="max-w-[280px] text-[28px] font-black leading-[0.98] tracking-[-0.04em] text-white">
            {title}
          </h1>

          <p className="mt-2 max-w-[300px] text-[13px] font-medium leading-5 text-white/82">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}