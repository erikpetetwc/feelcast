import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, location: true, conditions: true },
  });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const updateData: Record<string, unknown> = {};
  if (body.conditions !== undefined) updateData.conditions = body.conditions;
  if (body.name !== undefined) updateData.name = body.name;
  const user = await db.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, conditions: true },
  });
  return NextResponse.json(user);
}
