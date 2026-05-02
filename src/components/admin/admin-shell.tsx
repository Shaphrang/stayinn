"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const items: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <GridIcon /> },
  { label: "Owners", href: "/admin/owners", icon: <UsersIcon /> },
  { label: "Properties", href: "/admin/properties", icon: <HomeIcon /> },
  { label: "Rooms", href: "/admin/rooms", icon: <BedIcon /> },
  { label: "Bookings", href: "/admin/bookings", icon: <CalendarIcon /> },
  { label: "Locations", href: "/admin/locations", icon: <PinIcon /> },
  { label: "Settings", href: "/admin/settings", icon: <SettingsIcon /> },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") {
    return pathname === "/admin" || pathname === "/admin/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function prettyTitle(pathname: string) {
  if (pathname === "/admin" || pathname === "/admin/dashboard") return "Dashboard";
  const section = pathname.split("/").filter(Boolean)[1] || "dashboard";
  return section.charAt(0).toUpperCase() + section.slice(1);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = useMemo(() => prettyTitle(pathname), [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {open ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-[284px] flex-col overflow-hidden border-r border-white/10 bg-slate-950 text-white shadow-2xl transition-transform duration-300",
          "bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.33),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.2),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.8),transparent_35%)]",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-24 items-center justify-between px-6">
            <Link href="/admin/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <HomeIcon className="h-6 w-6 text-teal-300" />
              </div>
              <div>
                <p className="text-[2rem] leading-none font-bold tracking-tight">
                  Stay<span className="text-teal-400">Inn</span>
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-2">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={[
                    "group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-cyan-500/50 to-teal-400/45 text-white shadow-lg shadow-cyan-900/35 ring-1 ring-cyan-300/25"
                      : "text-slate-200 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  <span className={[
                    "flex h-9 w-9 items-center justify-center rounded-xl transition",
                    active ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10",
                  ].join(" ")}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[284px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur-lg">
          <div className="flex h-20 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
                aria-label="Open sidebar"
              >
                <MenuIcon />
              </button>
              <div>
                <p className="text-xl font-bold tracking-tight text-slate-900">{title}</p>
                <p className="hidden text-sm text-slate-500 sm:block">Welcome back, Admin! Here&apos;s what&apos;s happening today.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden w-[360px] items-center rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-500 shadow-sm md:flex lg:w-[420px]">
                <SearchIcon />
                <span className="ml-2">Search owners, properties, bookings...</span>
              </div>
              <button className="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50" aria-label="Notifications">
                <BellIcon />
                <span className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full bg-rose-500 px-1 text-center text-xs font-bold leading-5 text-white">3</span>
              </button>
              <form action="/admin/logout" method="post">
                <button className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">Logout</button>
              </form>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function IconBase({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>{children}</svg>;
}
function GridIcon({ className }: { className?: string }) { return <IconBase className={className}><path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 3.5h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconBase>; }
function UsersIcon() { return <IconBase><path d="M16 11a4 4 0 1 0-8 0m8 0a4 4 0 1 1-8 0m8 0c2.8 0 5 2.2 5 5v1.5A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5V16c0-2.8 2.2-5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></IconBase>; }
function HomeIcon({ className }: { className?: string }) { return <IconBase className={className}><path d="M3 11.5 12 4l9 7.5M5 10.5V20h14v-9.5M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconBase>; }
function BedIcon() { return <IconBase><path d="M4 11V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5m-9 0h16a2 2 0 0 1 2 2v7M4 11a2 2 0 0 0-2 2v7m0-4h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconBase>; }
function CalendarIcon() { return <IconBase><path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></IconBase>; }
function PinIcon() { return <IconBase><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.8"/></IconBase>; }
function SettingsIcon() { return <IconBase><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.24.35.6.6 1 .6h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1 .6Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></IconBase>; }
function SearchIcon() { return <IconBase className="h-4 w-4"><path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></IconBase>; }
function BellIcon() { return <IconBase className="h-5 w-5"><path d="M15 17H9m9-1V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconBase>; }
function MenuIcon() { return <IconBase className="h-5 w-5"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></IconBase>; }
