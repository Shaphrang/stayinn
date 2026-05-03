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
    <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#083f3c_0%,#0f9f9a_42%,#f59e0b_100%)] px-4 py-4 shadow-[0_16px_42px_rgba(15,118,110,0.22)]">
      <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/18 blur-2xl" />
      <div className="absolute -bottom-12 right-10 h-28 w-28 rounded-full bg-[#ffe2a8]/35 blur-2xl" />
      <div className="absolute right-5 top-5 h-14 w-14 rotate-12 rounded-[22px] border border-white/20 bg-white/10" />
      <div className="absolute bottom-4 left-[58%] h-8 w-8 rounded-full border border-white/20 bg-white/10" />
      <div className="absolute left-4 top-1/2 h-16 w-16 rounded-full border border-white/10" />

      <div className="relative z-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/80 ring-1 ring-white/18 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ffd166]" />
          StayInn
        </div>

        <div className="flex items-end justify-between gap-3">
          <h1 className="max-w-[270px] text-[25px] font-black leading-[1.02] tracking-[-0.045em] text-white">
            {tagline}
          </h1>

          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[23px] bg-white/16 text-[24px] shadow-inner ring-1 ring-white/20 backdrop-blur">
            ✦
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/13 px-3 py-2 ring-1 ring-white/14 backdrop-blur">
            <p className="text-[15px] font-black text-white">50+</p>
            <p className="text-[9px] font-bold uppercase tracking-wide text-white/65">
              Stays
            </p>
          </div>

          <div className="rounded-2xl bg-white/13 px-3 py-2 ring-1 ring-white/14 backdrop-blur">
            <p className="text-[15px] font-black text-white">Local</p>
            <p className="text-[9px] font-bold uppercase tracking-wide text-white/65">
              Curated
            </p>
          </div>

          <div className="rounded-2xl bg-white/13 px-3 py-2 ring-1 ring-white/14 backdrop-blur">
            <p className="text-[15px] font-black text-white">Easy</p>
            <p className="text-[9px] font-bold uppercase tracking-wide text-white/65">
              Booking
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}