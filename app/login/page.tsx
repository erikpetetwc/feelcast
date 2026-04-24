"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TwcLogo } from "@/components/TwcLogo";
import { credentialsSignIn } from "@/app/actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStep("");
    setLoading(true);

    try {
      if (mode === "register") {
        setStep("Creating account…");
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
          setStep("");
          return;
        }
      }

      setStep("Signing in…");
      const result = await credentialsSignIn(email, password);
      if (result?.error) {
        setError(result.error);
        setStep("");
        setLoading(false);
      }
    } catch (err) {
      setError("Something went wrong. Please check your connection and try again.");
      setStep("");
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
            onClick={() => { setMode("register"); setError(""); setStep(""); }}
            className={cn(
              "flex-1 py-2 rounded-md transition-colors",
              mode === "register" ? "bg-white shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); setStep(""); }}
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
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && (
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              )}
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
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              {mode === "register" && (
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
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Please wait…"
                  : mode === "register"
                  ? "Get started"
                  : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

