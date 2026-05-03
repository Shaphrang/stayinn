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

  return (
    <section className="relative min-h-[132px] overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#00a99d_0%,#079584_48%,#ff6f52_100%)] p-4 shadow-[0_18px_46px_rgba(15,118,110,0.18)]">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -bottom-12 left-12 h-28 w-28 rounded-full bg-[#ffd166]/30 blur-2xl" />
      <div className="absolute right-4 top-4 h-12 w-12 rounded-[22px] border border-white/20 bg-white/12 rotate-12" />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <p className="text-[12px] font-black text-white/88">
            Good to see you!
          </p>

          <h1 className="mt-1 max-w-[235px] text-[24px] font-black leading-[1.02] tracking-[-0.045em] text-white">
            {title}
          </h1>
        </div>

        <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-[18px] bg-white/90 shadow-sm backdrop-blur">
          <div className="px-3 py-2.5">
            <p className="text-[17px] font-black text-[#07877e]">50+</p>
            <p className="text-[11px] font-bold text-slate-500">Stays</p>
          </div>

          <div className="border-x border-slate-200 px-3 py-2.5">
            <p className="text-[17px] font-black text-[#07877e]">Local</p>
            <p className="text-[11px] font-bold text-slate-500">Curated</p>
          </div>

          <div className="px-3 py-2.5">
            <p className="text-[17px] font-black text-[#07877e]">Easy</p>
            <p className="text-[11px] font-bold text-slate-500">Booking</p>
          </div>
        </div>
      </div>
    </section>
  );
}