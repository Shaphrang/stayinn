import Link from "next/link";

const items = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/bookings", label: "Bookings", icon: "▦" },
  { href: "/favorites", label: "Favorites", icon: "♡" },
  { href: "/trips", label: "Trips", icon: "⌖" },
  { href: "/more", label: "More", icon: "⋯" },
];

export function BottomNav() {
  return <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[520px] -translate-x-1/2 border-t border-slate-200 bg-white/95 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur"><div className="grid grid-cols-5">{items.map((item, i) => <Link key={item.label} href={item.href} className={`flex flex-col items-center text-xs ${i === 0 ? "text-[#14aaa6]" : "text-slate-500"}`}><span className="text-base">{item.icon}</span>{item.label}</Link>)}</div></nav>;
}
