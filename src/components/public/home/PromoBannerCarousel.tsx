import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeData } from "./types";

function readString(obj: unknown, key: string, fallback = "") {
  if (!obj || typeof obj !== "object") return fallback;

  const value = (obj as Record<string, unknown>)[key];

  return typeof value === "string" && value.trim() ? value : fallback;
}

const fallbackBanners = [
  {
    title: "Upto 25% Off",
    subtitle: "Comfort stays near Shillong",
    label: "Weekend escape",
    href: "/stays?offer=weekend",
    tone: "teal",
  },
  {
    title: "Book Early Save More",
    subtitle: "On selected stays",
    label: "Early bird",
    href: "/stays?offer=early-bird",
    tone: "coral",
  },
];

export function PromoBannerCarousel({ data }: { data: HomeData }) {
  const source = data.banners.length ? data.banners : fallbackBanners;

  return (
    <section className="px-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-black tracking-tight text-slate-950">
          Offers for you
        </h2>

        <Link href="/stays" className="text-[12px] font-black text-[#07877e]">
          See all
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {source.slice(0, 5).map((banner, index) => {
          const title = readString(banner, "title", fallbackBanners[index % 2].title);
          const subtitle = readString(
            banner,
            "subtitle",
            fallbackBanners[index % 2].subtitle
          );
          const label = readString(banner, "label", fallbackBanners[index % 2].label);
          const href = readString(banner, "href", "/stays");

          const teal = index % 2 === 0;

          return (
            <Link
              key={`${title}-${index}`}
              href={href}
              className={[
                "relative h-[112px] w-[68%] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-[24px] p-4 text-white shadow-sm active:scale-[0.99]",
                teal
                  ? "bg-[radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.20),transparent_26%),linear-gradient(135deg,#00a99d,#07877e)]"
                  : "bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.20),transparent_26%),linear-gradient(135deg,#ff6f52,#ff4d43)]",
              ].join(" ")}
            >
              <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-white/12 blur-xl" />

              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-white/80">
                    {label}
                  </p>

                  <h3 className="mt-1 max-w-[170px] text-[19px] font-black leading-5 tracking-[-0.03em]">
                    {title}
                  </h3>

                  <p className="mt-1 max-w-[175px] text-[12px] font-bold leading-4 text-white/82">
                    {subtitle}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 text-[12px] font-black">
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