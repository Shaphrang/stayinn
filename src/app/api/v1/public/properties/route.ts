import { NextRequest, NextResponse } from "next/server";
import { listPublicProperties } from "@/lib/public/properties";

export async function GET(request: NextRequest) {
  try {
    const data = await listPublicProperties(request.nextUrl.searchParams);
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
  } catch (error) {
    console.error("PROPERTIES_FETCH_FAILED", error);
    return NextResponse.json({ success: false, error: { code: "PROPERTIES_FETCH_FAILED", message: "Unable to load properties right now." } }, { status: 500 });
  }
}
