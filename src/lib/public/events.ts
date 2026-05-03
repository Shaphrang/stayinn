import { ALLOWED_EVENT_TYPES } from "@/lib/public/constants";
import { supabaseInsert } from "@/lib/supabase/server";
import type { PublicEventPayload } from "@/types/public";

export async function recordPublicEvent(payload: PublicEventPayload, context: { userAgent?: string | null; referrer?: string | null }) {
  if (!ALLOWED_EVENT_TYPES.includes(payload.eventType as (typeof ALLOWED_EVENT_TYPES)[number])) {
    throw new Error("INVALID_QUERY_PARAMS");
  }
  await supabaseInsert("public_events", {
    event_type: payload.eventType,
    property_id: payload.propertyId ?? null,
    banner_id: payload.bannerId ?? null,
    category: payload.category ?? null,
    metadata: payload.metadata ?? {},
    user_agent: context.userAgent ?? null,
    referrer: context.referrer ?? null,
  });
  return { recorded: true };
}
