//src\components\public\home\HeroSearchCard.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  UsersRound,
  X,
} from "lucide-react";

function toISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromISO(value: string) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function humanDate(value: string, fallback: string) {
  const date = fromISO(value);
  if (!date) return fallback;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function monthTitle(date: Date) {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function DatePickerSheet({
  label,
  value,
  onChange,
  minDate,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
}) {
  const selectedDate = fromISO(value);
  const minimumDate = minDate ? fromISO(minDate) : null;

  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(
    selectedDate || minimumDate || new Date()
  );

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: Array<Date | null> = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [viewDate]);

  const goPrev = () => {
    setViewDate((current) => {
      return new Date(current.getFullYear(), current.getMonth() - 1, 1);
    });
  };

  const goNext = () => {
    setViewDate((current) => {
      return new Date(current.getFullYear(), current.getMonth() + 1, 1);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#f5f8f6] px-3 py-2.5 text-left ring-1 ring-slate-200/80 active:scale-[0.98]"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-[#0f9f9a] shadow-sm">
          <CalendarDays className="h-4 w-4" />
        </span>

        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">
            {label}
          </span>
          <span className="block truncate text-[13px] font-black text-slate-900">
            {humanDate(value, "Select")}
          </span>
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] mx-auto flex max-w-[460px] items-end justify-center bg-slate-950/35 px-3 pb-3 backdrop-blur-sm">
          <div className="w-full overflow-hidden rounded-[30px] bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0f9f9a]">
                  {label}
                </p>
                <h3 className="mt-1 text-[18px] font-black tracking-tight text-slate-950">
                  {monthTitle(viewDate)}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-100 text-slate-700 active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-100 text-slate-700 active:scale-95"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-950 text-white active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                <div
                  key={day}
                  className="py-1 text-[11px] font-black text-slate-400"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-10" />;
                }

                const disabled =
                  minimumDate &&
                  startOfDay(date).getTime() < startOfDay(minimumDate).getTime();

                const selected = selectedDate && isSameDay(date, selectedDate);
                const today = isSameDay(date, new Date());

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    disabled={Boolean(disabled)}
                    onClick={() => {
                      onChange(toISO(date));
                      setOpen(false);
                    }}
                    className={[
                      "grid h-10 place-items-center rounded-2xl text-[13px] font-black transition active:scale-95 disabled:opacity-25",
                      selected
                        ? "bg-[#0f9f9a] text-white shadow-md shadow-teal-900/15"
                        : today
                          ? "bg-[#e9fbf8] text-[#0f9f9a]"
                          : "bg-slate-50 text-slate-700",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function HeroSearchCard() {
  const router = useRouter();

  const todayIso = toISO(new Date());

  const [where, setWhere] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (where.trim()) params.set("where", where.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);

    router.push(`/stays?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[28px] bg-white p-3 shadow-[0_16px_44px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/80"
    >
      <div className="flex items-center gap-2 rounded-[22px] bg-[#f5f8f6] px-3 py-2.5 ring-1 ring-slate-200/80">
        <Search className="h-[18px] w-[18px] shrink-0 text-[#0f9f9a]" />

        <input
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          placeholder="Search location or stay"
          className="h-8 min-w-0 flex-1 bg-transparent text-[14px] font-bold text-slate-950 outline-none placeholder:text-slate-400"
        />

        <button
          type="button"
          aria-label="Filters"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2.5 flex gap-2">
        <DatePickerSheet
          label="Check in"
          value={checkIn}
          minDate={todayIso}
          onChange={(value) => {
            setCheckIn(value);

            if (checkOut && fromISO(checkOut) && fromISO(value)) {
              const out = fromISO(checkOut)!;
              const inn = fromISO(value)!;

              if (out.getTime() < inn.getTime()) {
                setCheckOut("");
              }
            }
          }}
        />

        <DatePickerSheet
          label="Check out"
          value={checkOut}
          minDate={checkIn || todayIso}
          onChange={setCheckOut}
        />
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#f5f8f6] px-3 py-2.5 ring-1 ring-slate-200/80">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-[#0f9f9a] shadow-sm">
            <UsersRound className="h-4 w-4" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">
              Guests
            </span>

            <input
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="h-5 w-full bg-transparent text-[13px] font-black text-slate-900 outline-none"
            />
          </span>
        </label>

        <button
          type="submit"
          className="flex h-[58px] min-w-[120px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#0f9f9a] to-[#08756f] px-4 text-[14px] font-black text-white shadow-lg shadow-teal-900/15 active:scale-[0.98]"
        >
          <MapPin className="h-[17px] w-[17px]" />
          Search
        </button>
      </div>
    </form>
  );
}