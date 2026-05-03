"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Heart, Home, Search, UserRound } from "lucide-react";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    matcher: (pathname: string) => pathname === "/",
  },
  {
    label: "Search",
    href: "/stays",
    icon: Search,
    matcher: (pathname: string) => pathname.startsWith("/stays"),
  },
  {
    label: "Saved",
    href: "/saved",
    icon: Heart,
    matcher: (pathname: string) => pathname.startsWith("/saved"),
  },
  {
    label: "Bookings",
    href: "/bookings",
    icon: CalendarDays,
    matcher: (pathname: string) => pathname.startsWith("/bookings"),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
    matcher: (pathname: string) => pathname.startsWith("/profile"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[460px] bg-white/92 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_38px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.matcher(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-black transition active:scale-95",
                active
                  ? "bg-[#e7fbf8] text-[#07877e]"
                  : "text-slate-400 hover:text-slate-700",
              ].join(" ")}
            >
              <Icon className="mb-1 h-[19px] w-[19px]" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}