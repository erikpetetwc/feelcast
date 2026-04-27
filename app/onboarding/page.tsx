"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SYMPTOM_GROUPS } from "@/lib/symptoms";

interface LocationResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

type Step = "welcome" | "location" | "conditions" | "done";

export default function OnboardingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");

  // Location state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");

  // Conditions state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (step === "done") {
      const t = setTimeout(() => router.push("/dashboard"), 1800);
      return () => clearTimeout(t);
    }
  }, [step, router]);

  async function searchLocation() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`);
      setResults(await res.json());
    } finally {
      setSearching(false);
    }
  }

  async function selectLocation(loc: LocationResult) {
    const data = { lat: loc.latitude, lon: loc.longitude, label: loc.displayName };
    localStorage.setItem("bw_location", JSON.stringify(data));
    setLocationLabel(loc.displayName);
    setResults([]);
    setQuery("");
    await fetch("/api/location", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setStep("conditions");
  }

  function toggleCondition(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function saveConditions() {
    setSaving(true);
    await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions: Array.from(selected) }),
    });
    setSaving(false);
    setStep("done");
  }

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {(["welcome", "location", "conditions"] as Step[]).map((s, i) => (
            <span
              key={s}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                step === s || (step === "done" && i === 2)
                  ? "bg-blue-500"
                  : ["welcome", "location", "conditions"].indexOf(step) > i
                  ? "bg-blue-300"
                  : "bg-gray-200"
              )}
            />
          ))}
        </div>

        {step === "welcome" && (
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="text-5xl mb-3">🌤️</div>
              <CardTitle className="text-xl">Welcome to FeelCast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                FeelCast helps you understand how today's weather affects your body — headaches, joint pain, breathing, and more.
              </p>
              <p className="text-sm text-muted-foreground">
                It takes 30 seconds to set up. Let's go.
              </p>
              <Button className="w-full" onClick={() => setStep("location")}>
                Get started →
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "location" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">📍 Where are you?</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                We need your location to fetch your local weather forecast.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ZIP code or city (e.g. 60601)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchLocation()}
                  className="flex-1 px-3 py-2 border rounded-md text-sm bg-white"
                  autoFocus
                />
                <Button onClick={searchLocation} disabled={searching} variant="outline">
                  {searching ? "…" : "Search"}
                </Button>
              </div>
              {results.length > 0 && (
                <ul className="border rounded-md divide-y text-sm bg-white">
                  {results.map((r, i) => (
                    <li key={i}>
                      <button onClick={() => selectLocation(r)} className="w-full text-left px-3 py-2 hover:bg-gray-50">
                        {r.displayName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => setStep("conditions")}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Skip for now
              </button>
            </CardContent>
          </Card>
        )}

        {step === "conditions" && (
          <Card className="overflow-visible">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">🩺 What affects you?</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {locationLabel ? `Set for ${locationLabel}. ` : ""}Select the symptoms you experience — we'll personalize your forecast around them.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {SYMPTOM_GROUPS.map((group) => (
                <div key={group.group}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {group.group}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleCondition(s.id)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-colors",
                          selected.has(s.id)
                            ? "bg-blue-50 border-blue-300 text-blue-800"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        <span className="text-lg leading-none">{s.icon}</span>
                        <span className="font-medium leading-tight">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <Button onClick={saveConditions} disabled={saving} className="flex-1">
                  {saving ? "Saving…" : selected.size > 0 ? `Save ${selected.size} condition${selected.size !== 1 ? "s" : ""}` : "Continue"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "done" && (
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <div className="text-5xl">✅</div>
              <p className="font-semibold text-lg">You're all set!</p>
              <p className="text-sm text-muted-foreground">Taking you to your first FeelCast…</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
