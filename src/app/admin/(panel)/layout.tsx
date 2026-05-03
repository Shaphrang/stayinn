//src\app\admin\(panel)\layout.tsx
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { StayInnAdminShell } from "@/components/admin/stayinn-admin-shell";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return <StayInnAdminShell>{children}</StayInnAdminShell>;
}