"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TwcLogo } from "@/components/TwcLogo";

function LoginPageInner() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const e = searchParams.get("error");
    if (e) {
      setMode("login");
      setError(
        e === "nouser" ? "No account found with that email" :
        e === "badpw" ? "Password incorrect" :
        e === "exception" ? "Server error — check Pi logs" :
        "Invalid email or password"
      );
    }
  }, [searchParams]);

  // After successful register, submit a real form POST to /api/auth/login.
  // A native form POST + server-side 303 redirect is the only approach that
  // reliably commits Set-Cookie on iOS Safari before the next page loads.
  function nativeLogin(emailVal: string, passwordVal: string) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/login";
    const e = document.createElement("input"); e.name = "email"; e.value = emailVal;
    const p = document.createElement("input"); p.name = "password"; p.value = passwordVal;
    form.append(e, p);
    document.body.appendChild(form);
    form.submit();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // creating account
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, zip: zip || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 409
            ? "That email is already registered — tap \"Sign in\" above."
            : (data.error ?? "Registration failed. Please try again.")
        );
        setLoading(false);
        return;
      }
      nativeLogin(email, password);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-sky-50 to-white">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="text-5xl mb-3">🌤️</div>
          <h1 className="text-3xl font-bold tracking-tight">FeelCast</h1>
          <p className="text-muted-foreground text-sm">
            See how today's weather affects your body
          </p>
          <p className="text-[11px] text-muted-foreground/50 mt-2 flex items-center justify-center gap-1.5">
            Powered by
            <TwcLogo />
          </p>
        </div>

        {/* Tabs outside Card — avoids iOS overflow-hidden touch-clipping */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg text-sm font-medium">
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            className={cn(
              "flex-1 py-2 rounded-md transition-colors",
              mode === "register" ? "bg-white shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={cn(
              "flex-1 py-2 rounded-md transition-colors",
              mode === "login" ? "bg-white shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign in
          </button>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {mode === "register" ? (
              <form onSubmit={handleRegister} className="space-y-3">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ZIP code (e.g. 60601)"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    maxLength={10}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                    for local weather
                  </span>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Please wait…" : "Get started"}
                </Button>
              </form>
            ) : (
              // Native HTML form POST → server-side 303 redirect → reliable cookie on iOS
              <form method="POST" action="/api/auth/login" className="space-y-3">
                {error && <p className="text-sm text-red-600">{error}</p>}
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <Button type="submit" className="w-full">Sign in</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}

