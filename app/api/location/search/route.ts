import { NextRequest, NextResponse } from "next/server";
import { searchLocation } from "@/lib/twc";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json([]);
  const results = await searchLocation(q);
  return NextResponse.json(results.slice(0, 6));
}
