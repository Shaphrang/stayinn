//src\app\admin\(panel)\layout.tsx
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  await requirePlatformAdmin();
  return <AdminShell>{children}</AdminShell>;
}
