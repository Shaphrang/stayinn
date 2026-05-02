import { cookies } from "next/headers";

const SESSION_KEY = "admin_session";
const DEFAULT_SESSION_MAX_AGE = 60 * 60;

type AdminSession = {
  userId: string;
  accessToken: string;
};

function encodeSession(session: AdminSession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decodeSession(value: string | undefined) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<AdminSession>;
    if (typeof parsed.userId !== "string" || typeof parsed.accessToken !== "string") return null;
    if (!parsed.userId || !parsed.accessToken) return null;

    return {
      userId: parsed.userId,
      accessToken: parsed.accessToken,
    };
  } catch {
    return null;
  }
}

export async function setAdminSession(userId: string, accessToken: string, maxAge = DEFAULT_SESSION_MAX_AGE) {
  const safeMaxAge = Number.isFinite(maxAge) && maxAge > 0 ? Math.floor(maxAge) : DEFAULT_SESSION_MAX_AGE;

  (await cookies()).set(SESSION_KEY, encodeSession({ userId, accessToken }), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: safeMaxAge,
  });
}

export async function getAdminSession() {
  return decodeSession((await cookies()).get(SESSION_KEY)?.value);
}

export async function clearAdminSession() {
  (await cookies()).delete(SESSION_KEY);
}
