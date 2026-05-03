//src\components\public\home\HomeHeader.tsx
import Link from "next/link";
import { Bell, MapPin, Menu } from "lucide-react";

export function HomeHeader() {
  return (
<header className="sticky top-0 z-40 bg-[#fbfcfb]/90 px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#05a99b] via-[#13b8a8] to-[#f6b23c] text-[15px] font-black text-white shadow-lg shadow-teal-900/20">
            S
          </span>

          <span className="min-w-0">
            <span className="block text-[21px] font-black leading-none tracking-[-0.045em] text-[#07877e]">
              StayInn
            </span>

            <span className="mt-1 flex items-center gap-1 text-[12px] font-bold text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-[#0f9f9a]" />
              Shillong, Meghalaya
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="grid h-11 w-11 place-items-center rounded-[20px] bg-[#fff2d8] text-[#b45309] shadow-sm ring-1 ring-orange-100 active:scale-95"
          >
            <Bell className="h-[19px] w-[19px]" />
          </button>

          <button
            type="button"
            aria-label="Open menu"
            className="grid h-11 w-11 place-items-center rounded-[20px] bg-[#06152f] text-white shadow-lg shadow-slate-950/15 active:scale-95"
          >
            <Menu className="h-[21px] w-[21px]" />
          </button>
        </div>
      </div>
    </header>
  );
}