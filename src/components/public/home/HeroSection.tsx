//src\components\public\home\HeroSection.tsx
import type { HomeData } from "./types";

function getText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function HeroSection({ data }: { data: HomeData }) {
  const hero = data.hero as Record<string, unknown>;

  const title = getText(
    hero.title || hero.tagline,
    "Find stays you’ll love"
  );

  const subtitle = getText(
    hero.subtitle,
    "Curated local stays around Meghalaya."
  );

  return (
    <section className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#00a99d_0%,#07877e_58%,#ff6f52_100%)] px-3.5 py-3 shadow-[0_10px_24px_rgba(15,118,110,0.13)]">
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/18 blur-2xl" />
      <div className="absolute -bottom-8 left-12 h-16 w-16 rounded-full bg-[#ffd166]/25 blur-xl" />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/14 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-white/82 ring-1 ring-white/14">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ffd166]" />
            StayInn
          </div>

          <h1 className="line-clamp-1 text-[18px] font-black leading-tight tracking-[-0.04em] text-white">
            {title}
          </h1>

          <p className="mt-0.5 line-clamp-1 text-[10.5px] font-semibold text-white/76">
            {subtitle}
          </p>
        </div>

        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[17px] bg-white/16 text-[20px] text-white shadow-inner ring-1 ring-white/20">
          ✦
        </div>
      </div>
    </section>
  );
}