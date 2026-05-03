import { NextRequest, NextResponse } from "next/server";
import { recordPublicEvent } from "@/lib/public/events";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = await recordPublicEvent(payload, { userAgent: request.headers.get("user-agent"), referrer: request.headers.get("referer") });
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_QUERY_PARAMS") {
      return NextResponse.json({ success: false, error: { code: "INVALID_QUERY_PARAMS", message: "Invalid event payload." } }, { status: 400 });
    }
    console.error("EVENT_RECORD_FAILED", error);
    return NextResponse.json({ success: false, error: { code: "EVENT_RECORD_FAILED", message: "Could not record event right now." } }, { status: 500 });
  }
}
