import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeData } from "./types";

type PromoCard = {
  title: string;
  subtitle: string;
  smallText: string;
  label: string;
  href: string;
};

const fallbackPromos: PromoCard[] = [
  {
    label: "Monsoon deals",
    title: "Flat 20% Off",
    subtitle: "Green views",
    smallText: "Great stays",
    href: "/stays?offer=monsoon",
  },
  {
    label: "Long stay offer",
    title: "Stay 3 Nights Get 1 Night Free",
    subtitle: "Selected stays",
    smallText: "",
    href: "/stays?offer=long-stay",
  },
];

function readString(obj: unknown, key: string, fallback = "") {
  if (!obj || typeof obj !== "object") return fallback;

  const value = (obj as Record<string, unknown>)[key];

  return typeof value === "string" && value.trim() ? value : fallback;
}

export function PromoBannerCarousel({ data }: { data: HomeData }) {
  const source = data.banners.length ? data.banners.slice(0, 2) : fallbackPromos;

  const promos = source.map((banner, index) => {
    const fallback = fallbackPromos[index % fallbackPromos.length];

    return {
      label: readString(banner, "label", fallback.label),
      title: readString(banner, "title", fallback.title),
      subtitle: readString(banner, "subtitle", fallback.subtitle),
      smallText: readString(banner, "smallText", fallback.smallText),
      href: readString(banner, "href", fallback.href),
    };
  });

  return (
    <section className="px-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[17px] font-black tracking-[-0.03em] text-slate-950">
          Offers for you
        </h2>

        <Link href="/stays" className="text-[12px] font-black text-[#07877e]">
          See all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {promos.map((promo, index) => {
          const teal = index % 2 === 0;

          return (
            <Link
              key={`${promo.title}-${index}`}
              href={promo.href}
              className={[
                "relative h-[126px] overflow-hidden rounded-[21px] p-4 text-white shadow-sm active:scale-[0.99]",
                teal
                  ? "bg-[radial-gradient(circle_at_78%_68%,rgba(255,255,255,0.16),transparent_27%),linear-gradient(135deg,#00a99d_0%,#07877e_100%)]"
                  : "bg-[radial-gradient(circle_at_82%_68%,rgba(255,255,255,0.16),transparent_28%),linear-gradient(135deg,#ff6f52_0%,#ff4d43_100%)]",
              ].join(" ")}
            >
              <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-white/12 blur-xl" />
              <div className="absolute right-3 bottom-4 h-12 w-12 rounded-full bg-white/10" />

              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-white/80">
                    {promo.label}
                  </p>

                  <h3 className="mt-2 line-clamp-2 text-[20px] font-black leading-[22px] tracking-[-0.04em] text-white">
                    {promo.title}
                  </h3>

                  {promo.subtitle ? (
                    <p className="mt-1 text-[12px] font-bold leading-4 text-white/86">
                      {promo.subtitle}
                    </p>
                  ) : null}

                  {promo.smallText ? (
                    <p className="text-[12px] font-bold leading-4 text-white/86">
                      {promo.smallText}
                    </p>
                  ) : null}
                </div>

                <span className="inline-flex items-center gap-1 text-[12px] font-black text-white">
                  Explore
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}