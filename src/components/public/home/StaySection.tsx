import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Star } from "lucide-react";
import type { HomeData } from "./types";

type StayItem = NonNullable<HomeData["featuredStays"]>[number];

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
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
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

function StayCard({ item, compact = false }: { item: StayItem; compact?: boolean }) {
  const title = getValue(item, ["name", "title", "propertyName"], "StayInn stay");
  const location = getValue(
    item,
    ["locationName", "location_name", "location", "districtName", "district_name"],
    "Meghalaya"
  );
  const image = getValue(item, ["coverImageUrl", "cover_image_url", "coverImage", "cover_image"]);
  const type = getValue(item, ["propertyType", "property_type", "roomType", "room_type"], "Stay");
  const rating = getNumber(item, ["rating", "avgRating", "average_rating"], 4.8);
  const price = getNumber(item, [
    "minPrice",
    "min_price",
    "weekdayRate",
    "weekday_rate",
    "price",
    "basePrice",
    "base_price",
  ]);

  if (compact) {
    return (
      <Link
        href={getStayHref(item)}
        className="flex gap-3 rounded-[24px] bg-white p-2.5 shadow-sm ring-1 ring-slate-200/70 active:scale-[0.99]"
      >
        <div className="relative h-[86px] w-[98px] shrink-0 overflow-hidden rounded-[19px] bg-slate-100">
          {image ? (
            <Image
              src={image}
              alt={title}
              width={240}
              height={200}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-teal-100 via-slate-100 to-orange-100" />
          )}
        </div>

        <div className="min-w-0 flex-1 py-1">
          <div className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-[#0f9f9a]">
            {type}
          </div>

          <h3 className="line-clamp-2 text-[14px] font-black leading-[17px] tracking-tight text-slate-950">
            {title}
          </h3>

          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{location}</span>
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[13px] font-black text-slate-950">
              {formatPrice(price)}
            </span>

            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">
              <Star className="h-3 w-3 fill-current" />
              {rating.toFixed(1)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={getStayHref(item)}
      className="block w-[78%] max-w-[330px] shrink-0 snap-start overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200/70 active:scale-[0.99]"
    >
      <div className="relative h-[170px] bg-slate-100">
        {image ? (
          <Image
            src={image}
            alt={title}
            width={640}
            height={420}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-teal-100 via-slate-100 to-orange-100" />
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-800 backdrop-blur">
            {type}
          </span>

          <button
            type="button"
            aria-label="Save stay"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-800 backdrop-blur active:scale-95"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-3.5">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <h3 className="line-clamp-1 text-[15px] font-black tracking-tight text-slate-950">
            {title}
          </h3>

          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">
            <Star className="h-3 w-3 fill-current" />
            {rating.toFixed(1)}
          </span>
        </div>

        <p className="flex items-center gap-1 text-[12px] font-semibold text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{location}</span>
        </p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Starts from
            </p>
            <p className="text-[15px] font-black text-slate-950">
              {formatPrice(price)}
              {price ? <span className="text-[11px] font-bold text-slate-400"> / night</span> : null}
            </p>
          </div>

          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-950 text-white">
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
  compact = false,
}: {
  title: string;
  subtitle?: string;
  items: StayItem[];
  viewAllHref: string;
  compact?: boolean;
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
            <p className="mt-0.5 text-[12px] font-medium text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>

        <Link
          href={viewAllHref}
          className="shrink-0 text-[12px] font-bold text-[#0f9f9a]"
        >
          View all
        </Link>
      </div>

      {compact ? (
        <div className="space-y-3">
          {items.slice(0, 5).map((item, index) => (
            <StayCard key={`${getStayHref(item)}-${index}`} item={item} compact />
          ))}
        </div>
      ) : (
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
          {items.slice(0, 8).map((item, index) => (
            <StayCard key={`${getStayHref(item)}-${index}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}