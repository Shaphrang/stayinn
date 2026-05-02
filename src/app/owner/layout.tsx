import type { ReactNode } from "react";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return <div className="bg-slate-50">{children}</div>;
}
