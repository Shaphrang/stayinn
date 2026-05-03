//src\components\public\home\HeroSearchCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  MapPin,
  Search,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";

export function HeroSearchCard() {
  const router = useRouter();

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
      className="relative z-10 rounded-[26px] bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.13)] ring-1 ring-slate-200/70"
    >
      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
        <Search className="h-[18px] w-[18px] shrink-0 text-[#0f9f9a]" />

        <input
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          placeholder="Search location or stay"
          className="h-8 min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />

        <button
          type="button"
          aria-label="Filters"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <label className="rounded-2xl bg-[#f7faf9] px-3 py-2.5 ring-1 ring-slate-200/80">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" />
            In
          </span>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-[11px] font-bold text-slate-800 outline-none"
          />
        </label>

        <label className="rounded-2xl bg-[#f7faf9] px-3 py-2.5 ring-1 ring-slate-200/80">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" />
            Out
          </span>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-[11px] font-bold text-slate-800 outline-none"
          />
        </label>

        <label className="rounded-2xl bg-[#f7faf9] px-3 py-2.5 ring-1 ring-slate-200/80">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <UsersRound className="h-3.5 w-3.5" />
            Guests
          </span>
          <input
            type="number"
            min="1"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="w-full bg-transparent text-[12px] font-black text-slate-800 outline-none"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0f9f9a] text-[14px] font-extrabold text-white shadow-lg shadow-teal-900/15 active:scale-[0.98]"
      >
        <MapPin className="h-[17px] w-[17px]" />
        Search stays
      </button>
    </form>
  );
}