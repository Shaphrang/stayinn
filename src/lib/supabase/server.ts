import { getSupabaseEnv } from "@/lib/supabase/env";

type SupabaseWriteMethod = "POST" | "PATCH" | "DELETE";

export type SupabasePagedResult<T> = {
  data: T[];
  count: number;
};

function getBaseUrl() {
  const { url } = getSupabaseEnv();

  return url.replace(/\/$/, "");
}

function getSupabaseHeaders(options?: {
  accessToken?: string;
  useServiceRole?: boolean;
  prefer?: string;
  range?: string;
}): HeadersInit {
  const { publishableKey, serviceRoleKey } = getSupabaseEnv();

  if (!publishableKey) {
    throw new Error("Supabase publishable key is not configured.");
  }

  if (options?.useServiceRole && !serviceRoleKey) {
    throw new Error("Supabase service role key is not configured.");
  }

  const apiKey: string = options?.useServiceRole
    ? serviceRoleKey as string
    : publishableKey;

  const authToken: string | undefined = options?.useServiceRole
    ? serviceRoleKey as string
    : options?.accessToken;

  const headers: Record<string, string> = {
    apikey: apiKey,
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (options?.prefer) {
    headers.Prefer = options.prefer;
  }

  if (options?.range) {
    headers["Range-Unit"] = "items";
    headers.Range = options.range;
  }

  return headers;
}

async function readJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();

  if (!text) {
    return [] as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text);
  }
}

async function getSupabaseErrorMessage(res: Response, fallback: string) {
  const text = await res.text();

  if (!text) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(text);

    return (
      parsed?.message ??
      parsed?.hint ??
      parsed?.details ??
      parsed?.error_description ??
      parsed?.error ??
      fallback
    );
  } catch {
    return text || fallback;
  }
}

async function throwSupabaseError(
  res: Response,
  fallback: string,
): Promise<never> {
  const message = await getSupabaseErrorMessage(res, fallback);

  throw new Error(message);
}

function getCountFromContentRange(value: string | null, fallback: number) {
  if (!value) return fallback;

  const total = value.split("/")[1];
  const count = Number(total);

  return Number.isFinite(count) ? count : fallback;
}

export async function supabaseSelect<T>(
  table: string,
  select: string,
  extra = "",
  accessToken?: string,
): Promise<T[]> {
  const q = `${getBaseUrl()}/rest/v1/${table}?select=${encodeURIComponent(
    select,
  )}${extra}`;

  const res = await fetch(q, {
    headers: getSupabaseHeaders({ accessToken }),
    cache: "no-store",
  });

  if (!res.ok) {
    await throwSupabaseError(res, `Failed query for ${table}`);
  }

  return readJsonResponse<T[]>(res);
}

export async function supabaseSelectPage<T>(
  table: string,
  select: string,
  extra = "",
  range: { from: number; to: number },
): Promise<SupabasePagedResult<T>> {
  const q = `${getBaseUrl()}/rest/v1/${table}?select=${encodeURIComponent(
    select,
  )}${extra}`;

  const res = await fetch(q, {
    headers: getSupabaseHeaders({
      useServiceRole: true,
      prefer: "count=exact",
      range: `${range.from}-${range.to}`,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    await throwSupabaseError(res, `Failed paginated query for ${table}`);
  }

  const data = await readJsonResponse<T[]>(res);

  return {
    data,
    count: getCountFromContentRange(
      res.headers.get("content-range"),
      data.length,
    ),
  };
}

export async function supabaseCount(table: string, extra = "") {
  const result = await supabaseSelectPage<{ id: string }>(
    table,
    "id",
    extra,
    {
      from: 0,
      to: 0,
    },
  );

  return result.count;
}

async function writeRequest(
  table: string,
  method: SupabaseWriteMethod,
  body?: unknown,
  filter = "",
) {
  const { serviceRoleKey } = getSupabaseEnv();

  if (!serviceRoleKey) {
    throw new Error("Supabase service role key is not configured.");
  }

  const q = `${getBaseUrl()}/rest/v1/${table}${filter ? `?${filter}` : ""}`;

  const res = await fetch(q, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    await throwSupabaseError(res, `Failed ${method} ${table}`);
  }

  return readJsonResponse(res);
}

export async function supabaseInsert(table: string, payload: unknown) {
  return writeRequest(table, "POST", payload);
}

export async function supabasePatch(
  table: string,
  payload: unknown,
  filter: string,
) {
  return writeRequest(table, "PATCH", payload, filter);
}

export async function supabaseDelete(table: string, filter: string) {
  return writeRequest(table, "DELETE", undefined, filter);
}

export async function supabaseRpc<T = unknown>(
  functionName: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const { serviceRoleKey } = getSupabaseEnv();

  if (!serviceRoleKey) {
    throw new Error("Supabase service role key is not configured.");
  }

  const res = await fetch(`${getBaseUrl()}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    await throwSupabaseError(res, `Failed RPC ${functionName}`);
  }

  return readJsonResponse<T>(res);
}