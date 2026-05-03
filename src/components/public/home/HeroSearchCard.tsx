"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeroSearchCard() {
  const router = useRouter();
  const [where, setWhere] = useState("Anywhere");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("where", where);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", guests);
    router.push(`/stays?${params.toString()}`);
  };

  return (
    <form onSubmit={onSubmit} className="mx-4 -mt-14 rounded-[2rem] bg-white p-4 shadow-lg">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="text-sm"><span className="mb-1 flex items-center gap-1 font-medium text-slate-700"><span>📍</span>Where to?</span><input value={where} onChange={(e) => setWhere(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-500" /></label>
        <label className="text-sm"><span className="mb-1 flex items-center gap-1 font-medium text-slate-700"><span>📅</span>Check-in</span><input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-500" /></label>
        <label className="text-sm"><span className="mb-1 flex items-center gap-1 font-medium text-slate-700"><span>📅</span>Check-out</span><input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-500" /></label>
        <label className="text-sm"><span className="mb-1 flex items-center gap-1 font-medium text-slate-700"><span>👥</span>Guests</span><input value={guests} onChange={(e) => setGuests(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-500" /></label>
      </div>
      <button type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#14aaa6] px-4 py-3 font-semibold text-white"><span>🔎</span>Search stays</button>
    </form>
  );
}
