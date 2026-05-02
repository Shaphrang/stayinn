import { cookies } from "next/headers";

const ACCESS_KEY = "admin_access_token";

export async function setAdminSession(accessToken: string) {
  (await cookies()).set(ACCESS_KEY, accessToken, { path: "/", sameSite: "lax", httpOnly: true, secure: true });
}

export async function getAdminSession() {
  return (await cookies()).get(ACCESS_KEY)?.value ?? null;
}

export async function clearAdminSession() {
  (await cookies()).delete(ACCESS_KEY);
}
