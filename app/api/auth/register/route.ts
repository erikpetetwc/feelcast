import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { searchLocation } from "@/lib/twc";

export async function POST(req: NextRequest) {
  const { email, password, name, zip } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }
  const hashed = await bcrypt.hash(password, 12);

  let location = null;
  if (zip?.trim()) {
    try {
      const results = await searchLocation(zip.trim());
      if (results.length > 0) {
        const { latitude, longitude, displayName } = results[0];
        location = { lat: latitude, lon: longitude, label: displayName };
      }
    } catch {}
  }

  const user = await db.user.create({
    data: { email, password: hashed, name: name?.trim() || null, location: location ?? undefined },
  });
  return NextResponse.json({ id: user.id, email: user.email, location });
}
