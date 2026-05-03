import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  MapPin,
  Navigation,
  Sparkles,
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

function formatPrice(value: number) {
  if (!value) return "View price";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
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
    rating: getNumber(item, ["rating", "avgRating", "average_rating"], 4.8),
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

function FeaturedMiniCard({ item }: { item: StayItem }) {
  const stay = getStayData(item);

  return (
    <Link
      href={getStayHref(item)}
      className="block w-[40%] min-w-[150px] max-w-[176px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-slate-200/75 active:scale-[0.99]"
    >
      <div className="relative h-[98px] bg-slate-100">
        {stay.image ? (
          <Image
            src={stay.image}
            alt={stay.title}
            width={360}
            height={260}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#d7f7ef] via-[#f8fafc] to-[#ffe7bd]" />
        )}

        <div className="absolute inset-x-0 top-0 flex justify-between p-2">
          <span className="rounded-full bg-white/90 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-800 backdrop-blur">
            {stay.type}
          </span>

          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-rose-500 backdrop-blur">
            <Heart className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <div className="p-2.5">
        <h3 className="line-clamp-1 text-[12px] font-black tracking-tight text-slate-950">
          {stay.title}
        </h3>

        <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-500">
          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="truncate">{stay.location}</span>
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-black text-slate-950">
            {formatPrice(stay.price)}
          </span>

          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-1 text-[9px] font-black text-amber-700">
            <Star className="h-2.5 w-2.5 fill-current" />
            {stay.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function WeekendSwipeCard({ item }: { item: StayItem }) {
  const stay = getStayData(item);

  return (
    <Link
      href={getStayHref(item)}
      className="relative flex h-[128px] w-[72%] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-[26px] bg-slate-950 shadow-sm active:scale-[0.99]"
    >
      {stay.image ? (
        <Image
          src={stay.image}
          alt={stay.title}
          width={520}
          height={320}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_18%_20%,#5eead4,transparent_35%),linear-gradient(135deg,#0f9f9a,#0f172a)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-950/34 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-between p-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/16 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white ring-1 ring-white/20 backdrop-blur">
            Weekend
          </span>

          <span className="flex items-center gap-1 rounded-full bg-white/16 px-2 py-1 text-[9px] font-black text-white ring-1 ring-white/20 backdrop-blur">
            <Star className="h-2.5 w-2.5 fill-current" />
            {stay.rating.toFixed(1)}
          </span>
        </div>

        <div>
          <h3 className="line-clamp-1 max-w-[210px] text-[16px] font-black leading-5 tracking-tight text-white">
            {stay.title}
          </h3>

          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-white/75">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{stay.location}</span>
          </p>

          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-black text-slate-950">
            {formatPrice(stay.price)}
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function NearbyCard({ item, index }: { item: StayItem; index: number }) {
  const stay = getStayData(item);

  return (
    <Link
      href={getStayHref(item)}
      className="group relative overflow-hidden rounded-[28px] bg-white p-2.5 shadow-sm ring-1 ring-slate-200/75 active:scale-[0.99]"
    >
      <div
        className={[
          "absolute inset-x-0 top-0 h-20",
          index % 2 === 0
            ? "bg-gradient-to-r from-[#e9fbf8] via-white to-[#fff3df]"
            : "bg-gradient-to-r from-[#eef2ff] via-white to-[#fef2f2]",
        ].join(" ")}
      />

      <div className="relative z-10 flex gap-3">
        <div className="relative h-[92px] w-[104px] shrink-0 overflow-hidden rounded-[22px] bg-slate-100">
          {stay.image ? (
            <Image
              src={stay.image}
              alt={stay.title}
              width={260}
              height={220}
              unoptimized
              className="h-full w-full object-cover transition group-active:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#d7f7ef] via-[#f8fafc] to-[#ffe7bd]" />
          )}

          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-800 backdrop-blur">
            Near
          </span>
        </div>

        <div className="min-w-0 flex-1 py-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e9fbf8] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[#0f9f9a]">
              <Sparkles className="h-3 w-3" />
              {stay.type}
            </span>

            <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700">
              <Star className="h-2.5 w-2.5 fill-current" />
              {stay.rating.toFixed(1)}
            </span>
          </div>

          <h3 className="line-clamp-2 text-[14px] font-black leading-[17px] tracking-tight text-slate-950">
            {stay.title}
          </h3>

          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Navigation className="h-3.5 w-3.5 shrink-0 text-[#0f9f9a]" />
            <span className="truncate">{stay.location}</span>
          </p>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="truncate text-[13px] font-black text-slate-950">
              {formatPrice(stay.price)}
              {stay.price ? (
                <span className="text-[10px] font-bold text-slate-400">
                  {" "}
                  / night
                </span>
              ) : null}
            </span>

            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
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
          <h2 className="text-[16px] font-black tracking-tight text-slate-950">
            {title}
          </h2>

          {subtitle ? (
            <p className="mt-0.5 text-[12px] font-semibold text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>

        <Link
          href={viewAllHref}
          className="shrink-0 text-[12px] font-black text-[#0f9f9a]"
        >
          View all
        </Link>
      </div>

      {layout === "featured" ? (
        <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
          {items.slice(0, 10).map((item, index) => (
            <FeaturedMiniCard key={`${getStayHref(item)}-${index}`} item={item} />
          ))}
        </div>
      ) : null}

      {layout === "weekend" ? (
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
          {items.slice(0, 8).map((item, index) => (
            <WeekendSwipeCard key={`${getStayHref(item)}-${index}`} item={item} />
          ))}
        </div>
      ) : null}

      {layout === "nearby" ? (
        <div className="space-y-3">
          {items.slice(0, 5).map((item, index) => (
            <NearbyCard
              key={`${getStayHref(item)}-${index}`}
              item={item}
              index={index}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}