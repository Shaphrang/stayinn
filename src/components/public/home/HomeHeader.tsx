//src\components\public\home\HomeHeader.tsx
import Link from "next/link";
import { Bell, MapPin, Menu } from "lucide-react";

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-40 bg-[#fff8eb]/82 px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#0f9f9a] via-[#13b8a8] to-[#f59e0b] text-sm font-black text-white shadow-md shadow-teal-900/15">
            S
          </span>

          <span className="min-w-0">
            <span className="block bg-gradient-to-r from-[#0f766e] via-[#0f9f9a] to-[#e57918] bg-clip-text text-[18px] font-black leading-none tracking-[-0.03em] text-transparent">
              StayInn
            </span>
            <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <MapPin className="h-3 w-3 text-[#0f9f9a]" />
              Shillong, Meghalaya
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff3df] text-[#b45309] shadow-sm ring-1 ring-orange-100 active:scale-95"
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>

          <button
            type="button"
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-slate-950 to-slate-800 text-white shadow-sm active:scale-95"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}