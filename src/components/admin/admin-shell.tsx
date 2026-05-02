"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = ["dashboard","owners","properties","rooms","bookings","locations","settings"];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen bg-slate-50 flex">
    <aside className={`${open?"block":"hidden"} md:block w-64 bg-white border-r p-4 fixed md:static h-full z-20`}>
      <div className="font-bold mb-4">StayInn Admin</div>
      {items.map((i)=><Link key={i} href={`/admin/${i}`} className={`block px-3 py-2 rounded mb-1 ${path===`/admin/${i}`?"bg-slate-900 text-white":"hover:bg-slate-100"}`}>{i[0].toUpperCase()+i.slice(1)}</Link>)}
    </aside>
    <main className="flex-1 md:ml-0 ml-0">
      <header className="bg-white border-b p-3 flex justify-between"><button className="md:hidden" onClick={()=>setOpen(!open)}>☰</button>
      <form action="/admin/logout" method="post"><button className="px-3 py-1 rounded bg-slate-900 text-white">Logout</button></form></header>
      <div className="p-4">{children}</div>
    </main>
  </div>;
}
