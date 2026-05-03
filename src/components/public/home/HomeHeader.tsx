//src\components\public\home\HomeHeader.tsx
import Link from "next/link";
import { Bell, MapPin, Menu } from "lucide-react";

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-[#f6f7f5]/90 px-4 pb-3 pt-[calc(14px+env(safe-area-inset-top))] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#0f9f9a] text-sm font-black text-white shadow-sm shadow-teal-900/10">
            S
          </span>

          <span className="min-w-0">
            <span className="block text-[18px] font-extrabold leading-none tracking-tight text-slate-950">
              StayInn
            </span>
            <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <MapPin className="h-3 w-3 text-[#0f9f9a]" />
              Shillong, Meghalaya
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200/70 active:scale-95"
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>

          <button
            type="button"
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white shadow-sm active:scale-95"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}