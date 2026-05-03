import { NextResponse } from "next/server";
import { getPublicPropertyBySlug } from "@/lib/public/properties";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const data = await getPublicPropertyBySlug(slug);
    if (!data) {
      return NextResponse.json({ success: false, error: { code: "PROPERTY_NOT_FOUND", message: "Property not found." } }, { status: 404 });
    }
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("PROPERTIES_FETCH_FAILED", error);
    return NextResponse.json({ success: false, error: { code: "PROPERTIES_FETCH_FAILED", message: "Unable to load property details right now." } }, { status: 500 });
  }
}
