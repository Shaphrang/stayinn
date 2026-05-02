import { cookies } from "next/headers";

const SESSION_KEY = "admin_session";

export async function setAdminSession(userId: string) {
  (await cookies()).set(SESSION_KEY, userId, { path: "/", sameSite: "lax", httpOnly: true, secure: true });
}

export async function getAdminSession() {
  return (await cookies()).get(SESSION_KEY)?.value ?? null;
}

export async function clearAdminSession() {
  (await cookies()).delete(SESSION_KEY);
}
