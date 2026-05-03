import Link from "next/link";
import { CalendarDays, Heart, Home, Search, UserRound } from "lucide-react";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    active: true,
  },
  {
    label: "Search",
    href: "/stays",
    icon: Search,
  },
  {
    label: "Saved",
    href: "/saved",
    icon: Heart,
  },
  {
    label: "Bookings",
    href: "/bookings",
    icon: CalendarDays,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[460px] border-t border-slate-200/80 bg-white/92 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-black transition active:scale-95",
                item.active
                  ? "bg-[#e9fbf8] text-[#0f9f9a]"
                  : "text-slate-400 hover:text-slate-700",
              ].join(" ")}
            >
              <Icon className="mb-1 h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}