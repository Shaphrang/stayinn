import { NextResponse } from "next/server";
import { getPublicHomeData } from "@/lib/public/home";

export async function GET() {
  try {
    const data = await getPublicHomeData();
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("HOME_FETCH_FAILED", error);
    return NextResponse.json({ success: false, error: { code: "HOME_FETCH_FAILED", message: "Unable to load homepage data right now." } }, { status: 500 });
  }
}
