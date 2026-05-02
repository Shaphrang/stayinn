import type { ReactNode } from "react";

export function DashboardShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {children}
      </div>
    </div>
  );
}
