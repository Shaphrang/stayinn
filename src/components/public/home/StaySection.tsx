import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  MapPin,
  Navigation,
  Star,
} from "lucide-react";
import type { HomeData } from "./types";

type StayItem = NonNullable<HomeData["featuredStays"]>[number];
type LayoutType = "featured" | "weekend" | "nearby";

function getValue(item: StayItem, keys: string[], fallback = "") {
  const record = item as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }

  return fallback;
}

function getNumber(item: StayItem, keys: string[], fallback = 0) {
  const record = item as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (
      typeof value === "string" &&
      value.trim() &&
      !Number.isNaN(Number(value))
    ) {
      return Number(value);
    }
  }

  return fallback;
}

function getStayHref(item: StayItem) {
  const slug = getValue(item, ["slug"]);
  const id = getValue(item, ["id"]);

  if (slug) return `/stays/${slug}`;
  if (id) return `/stays/${id}`;

  return "/stays";
}

function getStayData(item: StayItem) {
  return {
    title: getValue(item, ["name", "title", "propertyName"], "StayInn stay"),
    location: getValue(
      item,
      [
        "locationName",
        "location_name",
        "location",
        "districtName",
        "district_name",
      ],
      "Meghalaya"
    ),
    image: getValue(item, [
      "coverImageUrl",
      "cover_image_url",
      "coverImage",
      "cover_image",
    ]),
    type: getValue(
      item,
      ["propertyType", "property_type", "roomType", "room_type"],
      "Stay"
    ),
    rating: getNumber(item, ["rating", "avgRating", "average_rating"], 0),
    price: getNumber(item, [
      "minPrice",
      "min_price",
      "weekdayRate",
      "weekday_rate",
      "price",
      "basePrice",
      "base_price",
    ]),
  };
}

function formatPrice(value: number) {
  if (!value) return "View price";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function ImageFallback() {
  return (
    <div className="h-full w-full bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.42),transparent_30%),linear-gradient(135deg,#d7fbf4,#fff2d8,#ffd2c7)]" />
  );
}

function FeaturedCard({ item, index }: { item: StayItem; index: number }) {
  const stay = getStayData(item);

  const borderTone =
    index % 3 === 0
      ? "from-[#00a99d] via-[#36c6bb] to-[#ff6f52]"
      : index % 3 === 1
        ? "from-[#ffb22e] via-[#ff6f52] to-[#00a99d]"
        : "from-[#7c5cff] via-[#00a99d] to-[#ff9f43]";

  return (
    <Link
      href={getStayHref(item)}
      className={[
        "block w-[41%] min-w-[148px] max-w-[178px] shrink-0 snap-start rounded-[23px] bg-gradient-to-br p-[1.4px] shadow-[0_12px_28px_rgba(15,23,42,0.10)] active:scale-[0.99]",
        borderTone,
      ].join(" ")}
    >
      <div className="overflow-hidden rounded-[21px] bg-white">
        <div className="relative h-[112px] bg-slate-100">
          {stay.image ? (
            <Image
              src={stay.image}
              alt={stay.title}
              width={420}
              height={300}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageFallback />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/48 via-transparent to-slate-950/10" />

          <div className="absolute left-2 top-2 rounded-full bg-white/92 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-slate-800 shadow-sm backdrop-blur">
            {stay.type}
          </div>

          <button
            type="button"
            aria-label="Save stay"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/92 text-rose-500 shadow-sm backdrop-blur active:scale-95"
          >
            <Heart className="h-3.5 w-3.5" />
          </button>

          <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/92 px-2 py-1 text-[9px] font-black text-[#b45309] shadow-sm backdrop-blur">
            <Star className="h-3 w-3 fill-current" />
            {stay.rating.toFixed(1)}
          </div>
        </div>

        <div className="p-2.5">
          <h3 className="line-clamp-2 min-h-[32px] text-[12.5px] font-black leading-[16px] tracking-[-0.025em] text-slate-950">
            {stay.title}
          </h3>

          <p className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <MapPin className="h-3 w-3 shrink-0 text-[#07877e]" />
            <span className="truncate">{stay.location}</span>
          </p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[8.5px] font-black uppercase tracking-wide text-slate-400">
                From
              </p>

              <p className="truncate text-[11.5px] font-black text-slate-950">
                {formatPrice(stay.price)}
              </p>
            </div>

            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#06152f] text-white shadow-sm">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function WeekendCard({ item, index }: { item: StayItem; index: number }) {
  const stay = getStayData(item);

  const borderTone =
    index % 3 === 0
      ? "from-[#00a99d] via-[#36c6bb] to-[#ff6f52]"
      : index % 3 === 1
        ? "from-[#ffb22e] via-[#ff6f52] to-[#00a99d]"
        : "from-[#7c5cff] via-[#00a99d] to-[#ff9f43]";

  return (
    <Link
      href={getStayHref(item)}
      className={[
        "block h-[140px] w-[76%] max-w-[320px] shrink-0 snap-start rounded-[25px] bg-gradient-to-br p-[1.5px] shadow-[0_12px_30px_rgba(15,23,42,0.10)] active:scale-[0.99]",
        borderTone,
      ].join(" ")}
    >
      <div className="relative h-full overflow-hidden rounded-[23px] bg-slate-950">
        {stay.image ? (
          <Image
            src={stay.image}
            alt={stay.title}
            width={620}
            height={380}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageFallback />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/84 via-slate-950/45 to-slate-950/10" />

        <div className="absolute inset-0 flex flex-col justify-between p-3">
          <div className="flex items-start justify-between">
            <span className="rounded-full bg-white/92 px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wide text-slate-800 shadow-sm backdrop-blur">
              Weekend
            </span>

            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/92 text-rose-500 shadow-sm backdrop-blur">
              <Heart className="h-4 w-4" />
            </span>
          </div>

          <div>
            <h3 className="line-clamp-2 max-w-[240px] text-[16px] font-black leading-[18px] tracking-[-0.03em] text-white">
              {stay.title}
            </h3>

            <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-white/78">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{stay.location}</span>
            </p>

            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-slate-950 shadow-sm">
              {formatPrice(stay.price)}
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function NearbyCard({ item, index }: { item: StayItem; index: number }) {
  const stay = getStayData(item);

  const borderTone =
    index % 4 === 0
      ? "from-[#00a99d] via-[#36c6bb] to-[#ff6f52]"
      : index % 4 === 1
        ? "from-[#4da3ff] via-[#00a99d] to-[#ff9f43]"
        : index % 4 === 2
          ? "from-[#34c759] via-[#00a99d] to-[#ff6f52]"
          : "from-[#7c5cff] via-[#00a99d] to-[#ff6f52]";

  return (
    <Link
      href={getStayHref(item)}
      className={[
        "block rounded-[19px] bg-gradient-to-br p-[1.2px] shadow-sm active:scale-[0.99]",
        borderTone,
      ].join(" ")}
    >
      <div className="relative overflow-hidden rounded-[18px] bg-[#fffdf8] p-2">
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="relative h-[64px] w-[80px] shrink-0 overflow-hidden rounded-[15px] bg-slate-100">
            {stay.image ? (
              <Image
                src={stay.image}
                alt={stay.title}
                width={210}
                height={170}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageFallback />
            )}

            <span className="absolute left-1.5 top-1.5 rounded-full bg-white/94 px-1.5 py-0.5 text-[7.5px] font-black uppercase tracking-wide text-slate-800 backdrop-blur">
              Nearby
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e7fbf8] px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-[#07877e]">
                Stay
              </span>

              <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-black text-[#b45309]">
                <Star className="h-3 w-3 fill-current" />
                {stay.rating.toFixed(1)}
              </span>
            </div>

            <h3 className="line-clamp-1 text-[12.5px] font-black tracking-[-0.02em] text-slate-950">
              {stay.title}
            </h3>

            <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-slate-500">
              <Navigation className="h-3 w-3 shrink-0 text-[#07877e]" />
              <span className="truncate">{stay.location}</span>
            </p>

            <p className="mt-1 text-[11.5px] font-black text-slate-950">
              {formatPrice(stay.price)}
              {stay.price ? (
                <span className="text-[9px] font-bold text-slate-400">
                  {" "}
                  / night
                </span>
              ) : null}
            </p>
          </div>

          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#06152f] text-white">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function StaySection({
  title,
  subtitle,
  items,
  viewAllHref,
  layout = "featured",
}: {
  title: string;
  subtitle?: string;
  items: StayItem[];
  viewAllHref: string;
  layout?: LayoutType;
}) {
  if (!items.length) return null;

  return (
    <section className="px-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[18px] font-black tracking-[-0.035em] text-slate-950">
            {title}
          </h2>

          {subtitle ? (
            <p className="mt-0.5 text-[12px] font-bold text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>

        <Link
          href={viewAllHref}
          className="shrink-0 text-[12px] font-black text-[#07877e]"
        >
          View all
        </Link>
      </div>

      {layout === "featured" ? (
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-1">
          {items.slice(0, 10).map((item, index) => (
            <FeaturedCard
              key={`${getStayHref(item)}-featured-${index}`}
              item={item}
              index={index}
            />
          ))}
        </div>
      ) : null}

      {layout === "weekend" ? (
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-1">
          {items.slice(0, 8).map((item, index) => (
            <WeekendCard
              key={`${getStayHref(item)}-weekend-${index}`}
              item={item}
              index={index}
            />
          ))}
        </div>
      ) : null}

      {layout === "nearby" ? (
        <div className="space-y-2.5">
          {items.slice(0, 8).map((item, index) => (
            <NearbyCard
              key={`${getStayHref(item)}-nearby-${index}`}
              item={item}
              index={index}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}