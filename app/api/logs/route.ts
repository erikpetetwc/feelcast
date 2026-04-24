import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurrentObs } from "@/lib/twc";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "30");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    dateFilter.lte = toDate;
  }

  const logs = await db.symptomLog.findMany({
    where: {
      userId: session.user.id,
      ...(Object.keys(dateFilter).length > 0 ? { loggedAt: dateFilter } : {}),
    },
    orderBy: { loggedAt: "desc" },
    take: limit,
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { symptoms, severity, notes, lat, lon, loggedAt } = body;
  if (!symptoms || !severity || lat === undefined || lon === undefined) {
    return NextResponse.json({ error: "symptoms, severity, lat, lon required" }, { status: 400 });
  }

  let weatherSnapshot = null;
  try {
    weatherSnapshot = await getCurrentObs(lat, lon);
  } catch {}

  const log = await db.symptomLog.create({
    data: {
      userId: session.user.id,
      symptoms,
      severity,
      notes: notes ?? null,
      weatherSnapshot: weatherSnapshot ? JSON.parse(JSON.stringify(weatherSnapshot)) : undefined,
      lat,
      lon,
      ...(loggedAt ? { loggedAt: new Date(loggedAt) } : {}),
    },
  });
  return NextResponse.json(log, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const { count } = await db.symptomLog.deleteMany({
    where: { userId: session.user.id, loggedAt: { gte: start, lte: end } },
  });
  return NextResponse.json({ deleted: count });
}
