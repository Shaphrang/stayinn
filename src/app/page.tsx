import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <h1 className="text-4xl font-bold">StayInn</h1>
      <p className="mt-2 text-slate-300">Admin + Owner CRUD foundation initialized.</p>
      <div className="mt-6 flex gap-4">
        <Link href="/admin/login" className="rounded bg-white px-4 py-2 text-slate-900">Admin</Link>
        <Link href="/owner/login" className="rounded bg-blue-500 px-4 py-2">Owner</Link>
      </div>
    </main>
  );
}
