import Image from "next/image";
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
          imageUrl: "",
          title: "Weekend escape",
          subtitle: "Book comfortable stays around Shillong.",
        },
        {
          imageUrl: "",
          title: "Featured deals",
          subtitle: "Discover handpicked homestays and resorts.",
        },
      ];

  return (
    <section className="px-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-black tracking-tight text-slate-950">
          Offers for you
        </h2>

        <Link href="/stays" className="text-[12px] font-bold text-[#0f9f9a]">
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
          const imageUrl = readString(banner, "imageUrl", "");

          return (
            <Link
              key={`${title}-${index}`}
              href={href}
              className="relative h-[118px] w-[82%] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[26px] bg-slate-900 shadow-sm active:scale-[0.99]"
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={title}
                  width={700}
                  height={320}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,#5eead4,transparent_34%),linear-gradient(135deg,#0f9f9a,#0f172a)]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-between p-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/16 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white ring-1 ring-white/20 backdrop-blur">
                    <BadgePercent className="h-3.5 w-3.5" />
                    Promo
                  </div>

                  <h3 className="max-w-[210px] text-[18px] font-black leading-5 tracking-tight text-white">
                    {title}
                  </h3>

                  <p className="mt-1 max-w-[220px] text-[11px] font-medium leading-4 text-white/75">
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