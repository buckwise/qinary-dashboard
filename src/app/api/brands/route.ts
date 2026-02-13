import { NextResponse } from "next/server";
import { fetchAllBrandsProcessed } from "@/lib/metricool";

export const revalidate = 900; // 15 minutes

export async function GET() {
  try {
    const brands = await fetchAllBrandsProcessed();
    return NextResponse.json(brands);
  } catch (error) {
    console.error("Failed to fetch brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}
