import { NextResponse } from "next/server";
import { getPublicFilters } from "@/lib/public/filters";

export async function GET() {
  try {
    const data = await getPublicFilters();
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch (error) {
    console.error("FILTERS_FETCH_FAILED", error);
    return NextResponse.json({ success: false, error: { code: "FILTERS_FETCH_FAILED", message: "Unable to load filters right now." } }, { status: 500 });
  }
}
