//src\components\public\home\HeroSearchCard.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Search,
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

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function DatePickerSheet({
  label,
  value,
  minDate,
  onChange,
}: {
  label: string;
  value: string;
  minDate?: string;
  onChange: (value: string) => void;
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

    for (let i = 0; i < firstDay; i += 1) days.push(null);

    for (let day = 1; day <= totalDays; day += 1) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [viewDate]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white px-3 py-2.5 text-left shadow-sm ring-1 ring-slate-200/80 active:scale-[0.98]"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[15px] bg-[#e7fbf8] text-[#07877e]">
          <CalendarDays className="h-4.5 w-4.5" />
        </span>

        <span className="min-w-0">
          <span className="block text-[11px] font-black text-slate-500">
            {label}
          </span>
          <span className="block truncate text-[13px] font-black text-slate-950">
            {humanDate(value, "Select date")}
          </span>
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] mx-auto flex max-w-[460px] items-end justify-center bg-slate-950/35 px-3 pb-3 backdrop-blur-sm">
          <div className="w-full rounded-[30px] bg-[#fffaf1] p-4 shadow-2xl ring-1 ring-white/80">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#07877e]">
                  {label}
                </p>
                <h3 className="mt-1 text-[18px] font-black tracking-tight text-slate-950">
                  {monthTitle(viewDate)}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() =>
                    setViewDate(
                      (current) =>
                        new Date(current.getFullYear(), current.getMonth() - 1, 1)
                    )
                  }
                  className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-orange-100 active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() =>
                    setViewDate(
                      (current) =>
                        new Date(current.getFullYear(), current.getMonth() + 1, 1)
                    )
                  }
                  className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-orange-100 active:scale-95"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  aria-label="Close calendar"
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
                        ? "bg-gradient-to-br from-[#07877e] to-[#00a99d] text-white shadow-md shadow-teal-900/15"
                        : today
                          ? "bg-[#e7fbf8] text-[#07877e]"
                          : "bg-white text-slate-700 ring-1 ring-orange-50",
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

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);

    params.set("guests", String(guests));

    router.push(`/stays?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[28px] bg-white/88 p-3 shadow-[0_18px_48px_rgba(15,23,42,0.10)] ring-1 ring-white/90 backdrop-blur"
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[12px] font-black text-[#07877e]">
            Plan your stay
          </p>
          <h2 className="mt-0.5 text-[17px] font-black tracking-[-0.03em] text-slate-950">
            Pick dates & guests
          </h2>
        </div>

        <span className="rounded-full bg-[#fff2d8] px-3 py-1.5 text-[11px] font-black text-[#b45309] ring-1 ring-orange-100">
          Easy booking
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DatePickerSheet
          label="Check in"
          value={checkIn}
          minDate={todayIso}
          onChange={(value) => {
            setCheckIn(value);

            const out = fromISO(checkOut);
            const inn = fromISO(value);

            if (out && inn && out.getTime() < inn.getTime()) {
              setCheckOut("");
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

      <div className="mt-2.5 grid grid-cols-[1fr_auto] gap-2">
        <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-200/80">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[15px] bg-[#e7fbf8] text-[#07877e]">
            <UsersRound className="h-4.5 w-4.5" />
          </span>

          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-black text-slate-500">
              Guests
            </span>
            <span className="block text-[13px] font-black text-slate-950">
              {guests} guest{guests > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Decrease guests"
              onClick={() => setGuests((value) => Math.max(1, value - 1))}
              className="grid h-7 w-7 place-items-center rounded-full bg-slate-50 text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              aria-label="Increase guests"
              onClick={() => setGuests((value) => Math.min(20, value + 1))}
              className="grid h-7 w-7 place-items-center rounded-full bg-slate-50 text-[#07877e] shadow-sm ring-1 ring-slate-200 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="flex h-[58px] min-w-[104px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#ff6f52] to-[#ff4d43] px-4 text-[14px] font-black text-white shadow-lg shadow-orange-900/15 active:scale-[0.98]"
        >
          Search
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}