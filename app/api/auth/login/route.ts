import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { encode } from "@auth/core/jwt";

export async function POST(req: NextRequest) {
  // Accept both form submission and JSON
  let email = "";
  let password = "";
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = await req.json();
    email = body.email ?? "";
    password = body.password ?? "";
  } else {
    const fd = await req.formData();
    email = (fd.get("email") as string) ?? "";
    password = (fd.get("password") as string) ?? "";
  }

  const authUrl = process.env.AUTH_URL ?? `http://${req.headers.get("host")}`;
  const secure = authUrl.startsWith("https");
  const cookieName = secure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  const makeError = () => {
    if (ct.includes("application/json")) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login?error=1", authUrl), { status: 303 });
  };

  try {
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return makeError();
    }

    // Encode using same algorithm + salt as NextAuth so auth() can decode it
    const token = await encode({
      token: { sub: user.id, id: user.id, name: user.name ?? null, email: user.email },
      secret: process.env.AUTH_SECRET!,
      maxAge: 30 * 24 * 60 * 60,
      salt: cookieName,
    });

    if (ct.includes("application/json")) {
      const res = NextResponse.json({ success: true });
      res.cookies.set(cookieName, token, {
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
      return res;
    }

    // Form POST — server-side redirect so browser commits cookie before loading /dashboard
    const res = NextResponse.redirect(new URL("/dashboard", authUrl), { status: 303 });
    res.cookies.set(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch {
    return makeError();
  }
}
