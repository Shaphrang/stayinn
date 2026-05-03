"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type StayInnAdminShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "▦", exact: true },
  { label: "Owners", href: "/admin/owners", icon: "♙" },
  { label: "Properties", href: "/admin/properties", icon: "⌂" },
  { label: "Rooms", href: "/admin/rooms", icon: "▱" },
  { label: "Bookings", href: "/admin/bookings", icon: "▣" },
  { label: "Locations", href: "/admin/locations", icon: "⌖" },
  { label: "Settings", href: "/admin/settings", icon: "⚙" },
];

function isActivePath(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function StayInnAdminShell({ children }: StayInnAdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7fbff] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] overflow-hidden bg-[#052b3a] text-white shadow-xl lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.26),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_38%)]" />

          <div className="relative flex h-full flex-col px-4 py-5">
            <Link href="/admin" className="mb-6 flex items-center gap-2.5 px-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/15 text-xl ring-1 ring-cyan-300/25">
                ⌂
              </div>

              <div>
                <p className="text-xl font-black leading-tight tracking-tight">
                  Stay<span className="text-cyan-300">Inn</span>
                </p>
                <p className="text-[11px] text-cyan-100/65">Admin Console</p>
              </div>
            </Link>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
                      active
                        ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-950/25"
                        : "text-slate-200 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-base transition ${
                        active
                          ? "bg-white/15 text-white"
                          : "bg-white/5 text-cyan-100 group-hover:bg-white/10"
                      }`}
                    >
                      {item.icon}
                    </span>

                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:pl-[232px]">
          <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f7fbff]/88 px-4 py-3 backdrop-blur-xl sm:px-5 lg:px-6">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-xl bg-[#052b3a] px-3 py-2 text-sm font-black text-white lg:hidden"
              >
                ⌂ Stay<span className="text-cyan-300">Inn</span>
              </Link>

              <div className="hidden flex-1 justify-center lg:flex">
                <div className="relative w-full max-w-md">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    ⌕
                  </span>

                  <input
                    type="search"
                    placeholder="Search owners, properties, bookings..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-10 text-[13px] text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                  />

                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                    /
                  </span>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2.5">
                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-base text-slate-600 shadow-sm transition hover:bg-slate-50"
                >
                  ♧
                  <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white">
                    8
                  </span>
                </button>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-cyan-200 text-sm">
                    👤
                  </div>

                  <div className="hidden sm:block">
                    <p className="text-xs font-bold leading-tight text-slate-900">
                      Admin
                    </p>
                    <p className="text-[10px] leading-tight text-slate-500">
                      Super Admin
                    </p>
                  </div>

                  <span className="text-xs text-slate-400">⌄</span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-5 lg:px-6">
            <div className="mx-auto max-w-[1500px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}