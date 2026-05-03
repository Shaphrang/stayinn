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
    <section className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#00a99d_0%,#07877e_52%,#ff6f52_100%)] px-4 pb-8 pt-4 shadow-[0_14px_34px_rgba(15,118,110,0.16)]">
      <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -bottom-10 left-14 h-20 w-20 rounded-full bg-[#ffd166]/28 blur-2xl" />
      <div className="absolute right-4 top-4 h-10 w-10 rotate-12 rounded-[18px] border border-white/20 bg-white/10" />

      <div className="relative z-10">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/14 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/82 ring-1 ring-white/16 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ffd166]" />
          StayInn
        </div>

        <h1 className="max-w-[245px] text-[21px] font-black leading-[1.02] tracking-[-0.045em] text-white">
          {title}
        </h1>

        <p className="mt-1 max-w-[250px] text-[11px] font-semibold leading-4 text-white/76">
          {subtitle}
        </p>
      </div>
    </section>
  );
}