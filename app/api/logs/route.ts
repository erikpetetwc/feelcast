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
  if (from) dateFilter.gte = new Date(`${from}T00:00:00.000Z`);
  if (to) dateFilter.lte = new Date(`${to}T23:59:59.999Z`);

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

  // Parse date-only strings as noon UTC to avoid timezone-day shifting
  // e.g. "2024-04-22" → new Date("2024-04-22") = Apr 22 00:00 UTC = Apr 21 8pm EDT (wrong day)
  // Fix:                 new Date("2024-04-22T12:00:00.000Z") = Apr 22 noon UTC = Apr 22 8am EDT ✓
  const parsedLoggedAt = loggedAt
    ? new Date(loggedAt.length === 10 ? `${loggedAt}T12:00:00.000Z` : loggedAt)
    : undefined;

  const log = await db.symptomLog.create({
    data: {
      userId: session.user.id,
      symptoms,
      severity,
      notes: notes ?? null,
      weatherSnapshot: weatherSnapshot ? JSON.parse(JSON.stringify(weatherSnapshot)) : undefined,
      lat,
      lon,
      ...(parsedLoggedAt ? { loggedAt: parsedLoggedAt } : {}),
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

  // Use explicit UTC day range to match how dates are stored and displayed
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);

  const { count } = await db.symptomLog.deleteMany({
    where: { userId: session.user.id, loggedAt: { gte: start, lte: end } },
  });
  return NextResponse.json({ deleted: count });
}
