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

  // Always derive base URL from the incoming request host so redirects work
  // regardless of what AUTH_URL is set to (e.g. localhost on the Pi).
  const host = req.headers.get("host") ?? "localhost:3000";
  const secure = (process.env.AUTH_URL ?? "").startsWith("https");
  const baseUrl = `${secure ? "https" : "http"}://${host}`;
  const cookieName = secure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  // DEBUG — remove after diagnosing iPhone login failure
  console.log("[login] ct:", ct, "email:", email, "pw-len:", password.length, "host:", host, "baseUrl:", baseUrl);

  const makeError = (code: string) => {
    console.log("[login] error:", code);
    if (ct.includes("application/json")) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(`/login?error=${code}`, baseUrl), { status: 303 });
  };

  try {
    const user = await db.user.findUnique({ where: { email } });
    console.log("[login] user found:", !!user, "has password:", !!user?.password);
    if (!user?.password) return makeError("nouser");
    const pwOk = await bcrypt.compare(password, user.password);
    console.log("[login] bcrypt result:", pwOk);
    if (!pwOk) return makeError("badpw");

    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("[login] AUTH_SECRET / NEXTAUTH_SECRET not set");
      return makeError("exception");
    }

    // Encode using same algorithm + salt as NextAuth so auth() can decode it
    const token = await encode({
      token: { sub: user.id, id: user.id, name: user.name ?? null, email: user.email },
      secret,
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
    console.log("[login] success, redirecting to", baseUrl + "/dashboard");
    const res = NextResponse.redirect(new URL("/dashboard", baseUrl), { status: 303 });
    res.cookies.set(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch (err) {
    console.error("[login] exception:", err);
    return makeError("exception");
  }
}
