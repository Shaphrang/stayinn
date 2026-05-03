//src\components\public\home\HeroSection.tsx
import type { HomeData } from "./types";

function getText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function HeroSection({ data }: { data: HomeData }) {
  const hero = data.hero as Record<string, unknown>;

  const tagline = getText(
    hero.tagline || hero.subtitle,
    "Your stay, perfectly curated."
  );

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[#0b8f8a] px-4 py-4 shadow-sm shadow-teal-900/10">
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/18 blur-2xl" />
      <div className="absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-[#ffe3a3]/35 blur-2xl" />
      <div className="absolute right-6 top-6 h-12 w-12 rounded-[1.4rem] border border-white/20 bg-white/10 rotate-12" />
      <div className="absolute bottom-5 right-24 h-8 w-8 rounded-full border border-white/20 bg-white/10" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/65">
            StayInn
          </p>

          <h1 className="mt-1 max-w-[250px] text-[22px] font-black leading-[1.05] tracking-[-0.04em] text-white">
            {tagline}
          </h1>
        </div>

        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[22px] bg-white/16 text-[24px] shadow-inner ring-1 ring-white/20 backdrop-blur">
          ✦
        </div>
      </div>
    </section>
  );
}