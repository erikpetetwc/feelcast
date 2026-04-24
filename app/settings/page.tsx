"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LocationResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

const HEALTH_CONDITIONS = [
  { id: "ra", label: "Rheumatoid Arthritis", icon: "🦾" },
  { id: "osteoarthritis", label: "Osteoarthritis", icon: "🦴" },
  { id: "fibromyalgia", label: "Fibromyalgia", icon: "⚡" },
  { id: "migraines", label: "Chronic Migraines", icon: "🤕" },
  { id: "asthma", label: "Asthma", icon: "🫁" },
  { id: "copd", label: "COPD", icon: "💨" },
  { id: "lupus", label: "Lupus", icon: "🌙" },
  { id: "ms", label: "Multiple Sclerosis", icon: "🧠" },
  { id: "anxiety", label: "Anxiety", icon: "😰" },
  { id: "seasonal_allergies", label: "Seasonal Allergies", icon: "🌿" },
  { id: "eczema", label: "Eczema / Psoriasis", icon: "🧴" },
  { id: "ibd", label: "IBD / Crohn's", icon: "🫀" },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const [conditionsSaved, setConditionsSaved] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [conditions, setConditions] = useState<Set<string>>(new Set());
  const [loadingConditions, setLoadingConditions] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    const stored = localStorage.getItem("bw_location");
    if (stored) setCurrentLocation(JSON.parse(stored).label);
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((user) => {
        if (Array.isArray(user.conditions)) {
          setConditions(new Set(user.conditions));
        }
        setLoadingConditions(false);
      });
  }, [status]);

  async function search() {
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
    setCurrentLocation(loc.displayName);
    setResults([]);
    setQuery("");
    await fetch("/api/location", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLocationSaved(true);
    setTimeout(() => setLocationSaved(false), 3000);
  }

  function toggleCondition(id: string) {
    setConditions((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function saveConditions() {
    await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions: Array.from(conditions) }),
    });
    setConditionsSaved(true);
    setTimeout(() => setConditionsSaved(false), 3000);
  }

  if (status === "loading") return null;

  return (
    <div>
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        <Card>
          <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Name: </span>{session?.user?.name ?? "—"}</p>
            <p><span className="text-muted-foreground">Email: </span>{session?.user?.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Location</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {currentLocation && (
              <p className="text-sm text-muted-foreground">
                Current: <span className="text-foreground font-medium">{currentLocation}</span>
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ZIP code or city"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <Button onClick={search} disabled={searching} variant="outline">
                {searching ? "…" : "Search"}
              </Button>
            </div>
            {results.length > 0 && (
              <ul className="border rounded-md divide-y text-sm">
                {results.map((r, i) => (
                  <li key={i}>
                    <button onClick={() => selectLocation(r)} className="w-full text-left px-3 py-2 hover:bg-gray-50">
                      {r.displayName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {locationSaved && <p className="text-sm text-green-600">✓ Location saved</p>}
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="text-base">My Health Conditions</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Select any conditions you have — FeelCast will personalize your forecast around them.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingConditions ? (
              <div className="h-24 bg-gray-100 animate-pulse rounded" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HEALTH_CONDITIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCondition(c.id)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-colors",
                      conditions.has(c.id)
                        ? "bg-blue-50 border-blue-300 text-blue-800"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <span className="text-lg leading-none">{c.icon}</span>
                    <span className="font-medium leading-tight">{c.label}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button onClick={saveConditions} disabled={loadingConditions}>
                {conditionsSaved ? "✓ Saved" : "Save conditions"}
              </Button>
              {conditions.size > 0 && (
                <button
                  type="button"
                  onClick={() => setConditions(new Set())}
                  className="text-xs text-muted-foreground hover:text-red-500 underline underline-offset-2"
                >
                  Clear all
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
