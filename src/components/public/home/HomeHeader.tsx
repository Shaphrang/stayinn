import Link from "next/link";

export function HomeHeader() {
  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-4">
      <Link href="/" className="flex items-center gap-2 text-[#0f9f9a]">
        <span className="rounded-xl bg-[#fff7ea] p-2 text-[#d7a85f]">~</span>
        <span className="text-4xl font-serif leading-none">StayInn</span>
      </Link>
      <div className="flex items-center gap-2">
        <button className="rounded-full bg-white p-3 shadow-sm">🔍</button>
        <button className="rounded-full bg-white p-3 shadow-sm">☰</button>
      </div>
    </header>
  );
}
