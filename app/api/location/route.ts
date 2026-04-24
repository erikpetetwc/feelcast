import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lat, lon, label } = await req.json();
  if (lat === undefined || lon === undefined) {
    return NextResponse.json({ error: "lat and lon required" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: { location: { lat, lon, label: label ?? "" } },
  });
  return NextResponse.json({ location: user.location });
}
