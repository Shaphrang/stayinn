import { redirect } from "next/navigation";

export async function requireRole(role: "platform_admin" | "owner") {
  const mockRole = process.env.NEXT_PUBLIC_DEMO_ROLE;
  if (mockRole !== role) {
    redirect(role === "platform_admin" ? "/admin/login" : "/owner/login");
  }
}
