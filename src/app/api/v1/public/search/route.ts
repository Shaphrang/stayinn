import { NextRequest, NextResponse } from "next/server";
import { searchPublicProperties } from "@/lib/public/search";

export async function GET(request: NextRequest) {
  try {
    const data = await searchPublicProperties(request.nextUrl.searchParams);
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_QUERY_PARAMS") {
      return NextResponse.json({ success: false, error: { code: "INVALID_QUERY_PARAMS", message: "Some search filters are invalid." } }, { status: 400 });
    }
    console.error("SEARCH_FAILED", error);
    return NextResponse.json({ success: false, error: { code: "SEARCH_FAILED", message: "Unable to search stays right now." } }, { status: 500 });
  }
}
