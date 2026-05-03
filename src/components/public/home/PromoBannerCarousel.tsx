import Link from "next/link";
import { ArrowRight, BadgePercent } from "lucide-react";
import type { HomeData } from "./types";

function readString(obj: unknown, key: string, fallback = "") {
  if (!obj || typeof obj !== "object") return fallback;
  const value = (obj as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function PromoBannerCarousel({ data }: { data: HomeData }) {
  const banners = data.banners.length
    ? data.banners
    : [
        {
          title: "Weekend escape",
          subtitle: "Book comfortable stays around Shillong.",
          href: "/stays",
        },
        {
          title: "Featured deals",
          subtitle: "Discover handpicked homestays and resorts.",
          href: "/stays?featured=true",
        },
      ];

  return (
    <section className="px-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-black tracking-tight text-slate-950">
          Offers for you
        </h2>

        <Link href="/stays" className="text-[12px] font-black text-[#0f9f9a]">
          See all
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {banners.slice(0, 5).map((banner, index) => {
          const title = readString(banner, "title", "Special stay offer");
          const subtitle = readString(
            banner,
            "subtitle",
            "Find places that match your travel mood."
          );
          const href = readString(banner, "href", "/stays");

          return (
            <Link
              key={`${title}-${index}`}
              href={href}
              className={[
                "relative h-[104px] w-[78%] max-w-[330px] shrink-0 snap-start overflow-hidden rounded-[26px] p-4 shadow-sm active:scale-[0.99]",
                index % 2 === 0
                  ? "bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.28),transparent_32%),linear-gradient(135deg,#0f9f9a,#0f766e,#0f172a)]"
                  : "bg-[radial-gradient(circle_at_18%_25%,rgba(255,255,255,0.28),transparent_30%),linear-gradient(135deg,#f59e0b,#c2410c,#111827)]",
              ].join(" ")}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15 blur-xl" />
              <div className="absolute -bottom-8 left-16 h-20 w-20 rounded-full bg-white/10 blur-xl" />

              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/16 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white ring-1 ring-white/20 backdrop-blur">
                    <BadgePercent className="h-3.5 w-3.5" />
                    Promo
                  </div>

                  <h3 className="max-w-[210px] text-[17px] font-black leading-5 tracking-tight text-white">
                    {title}
                  </h3>

                  <p className="mt-1 max-w-[230px] text-[11px] font-semibold leading-4 text-white/75">
                    {subtitle}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-black text-white">
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