"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { BodyWeatherCard } from "@/components/BodyWeatherCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { scoreFromIndices, worstRisk, riskDot, type BodyRisk, type RiskLevel } from "@/lib/body-score";
import { personalizeRisksBySymptoms, scoreLoggedSymptoms } from "@/lib/condition-symptom-map";
import { SYMPTOM_BY_ID } from "@/lib/symptoms";
import { cn } from "@/lib/utils";
import { TwcLogo } from "@/components/TwcLogo";

function ForecastDot({ dotClass }: { dotClass: string }) {
  return <span className={cn("w-2.5 h-2.5 rounded-full inline-block", dotClass)} />;
}

interface WeatherData {
  obs: {
    temperature: number | null;
    relativeHumidity: number | null;
    pressureChange: number | null;
    uvIndex: number | null;
    wxPhraseLong: string | null;
  } | null;
  forecast: {
    dayOfWeek: string[];
    temperatureMax: (number | null)[];
    temperatureMin: (number | null)[];
    precipChance: (number | null)[];
    narrative: (string | null)[];
  } | null;
  achePain: { index: (number | null)[]; category: (string | null)[] } | null;
  breathing: { index: (number | null)[]; category: (string | null)[] } | null;
  pollen: { index: (number | null)[]; category: (string | null)[] } | null;
}

type StoredLocation = { lat: number; lon: number; label: string };

const GENERIC_LABELS = new Set(["your location", "my location", ""]);

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<StoredLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [conditions, setConditions] = useState<string[] | null>(null);
  const [todayLog, setTodayLog] = useState<{ symptoms: unknown } | null | undefined>(undefined);
  const [zipInput, setZipInput] = useState("");
  const [zipSearching, setZipSearching] = useState(false);
  const [zipError, setZipError] = useState("");
  const [selectedForecastDay, setSelectedForecastDay] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((user) => setConditions(Array.isArray(user.conditions) ? user.conditions : []))
      .catch(() => setConditions([]));
    fetch("/api/logs?limit=1")
      .then((r) => r.json())
      .then((logs) => {
        const log = logs[0];
        if (!log) { setTodayLog(null); return; }
        const logDate = new Date(log.loggedAt);
        const now = new Date();
        const isToday =
          logDate.getFullYear() === now.getFullYear() &&
          logDate.getMonth() === now.getMonth() &&
          logDate.getDate() === now.getDate();
        setTodayLog(isToday ? log : null);
      })
      .catch(() => setTodayLog(null));
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const stored = localStorage.getItem("bw_location");
    const parsedStored: StoredLocation | null = stored ? JSON.parse(stored) : null;

    if (parsedStored?.lat && parsedStored?.lon && !GENERIC_LABELS.has(parsedStored.label?.toLowerCase() ?? "")) {
      setLocation(parsedStored);
      fetchWeather(parsedStored.lat, parsedStored.lon);
    } else {
      // Stale/missing label — fetch from DB
      fetch("/api/me")
        .then((r) => r.json())
        .then((user) => {
          const loc = user.location as StoredLocation | null;
          if (loc?.lat && loc?.lon && !GENERIC_LABELS.has(loc.label?.toLowerCase() ?? "")) {
            localStorage.setItem("bw_location", JSON.stringify(loc));
            setLocation(loc);
            fetchWeather(loc.lat, loc.lon);
          } else if (parsedStored?.lat && parsedStored?.lon) {
            // Have coords but bad label — still show weather, resolve label
            setLocation(parsedStored);
            fetchWeather(parsedStored.lat, parsedStored.lon);
            resolveLabel(parsedStored.lat, parsedStored.lon);
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  async function resolveLabel(lat: number, lon: number) {
    const res = await fetch(`/api/location/search?q=${lat},${lon}`);
    const results = await res.json();
    if (results.length) {
      const loc: StoredLocation = { lat, lon, label: results[0].displayName };
      localStorage.setItem("bw_location", JSON.stringify(loc));
      setLocation(loc);
    }
  }

  async function fetchWeather(lat: number, lon: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      setWeather(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault();
    setZipError("");
    if (!zipInput.trim()) return;
    setZipSearching(true);
    try {
      const res = await fetch(`/api/location/search?q=${encodeURIComponent(zipInput.trim())}`);
      const results = await res.json();
      if (!results.length) { setZipError("Location not found."); return; }
      const { latitude, longitude, displayName } = results[0];
      const loc: StoredLocation = { lat: latitude, lon: longitude, label: displayName };
      localStorage.setItem("bw_location", JSON.stringify(loc));
      setLocation(loc);
      await fetch("/api/location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loc),
      });
      fetchWeather(latitude, longitude);
    } finally {
      setZipSearching(false);
    }
  }

  const genericRisks: BodyRisk[] = weather
    ? scoreFromIndices({
        achePainCategory: weather.achePain?.category?.[0] ?? null,
        achePainIndex: weather.achePain?.index?.[0] ?? null,
        breathingCategory: weather.breathing?.category?.[0] ?? null,
        breathingIndex: weather.breathing?.index?.[0] ?? null,
        pollenCategory: weather.pollen?.category?.[0] ?? null,
        pollenIndex: weather.pollen?.index?.[0] ?? null,
        pressureChange: weather.obs?.pressureChange ?? null,
        uvIndex: weather.obs?.uvIndex ?? null,
      })
    : [];

  // Priority: today's log → saved conditions → generic
  const risks = todayLog
    ? scoreLoggedSymptoms(todayLog.symptoms, genericRisks, SYMPTOM_BY_ID)
    : conditions && conditions.length > 0
    ? personalizeRisksBySymptoms(conditions, genericRisks)
    : genericRisks;

  if (status === "loading") return null;

  return (
    <div>
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            Good {getGreeting()}{session?.user?.name ? `, ${session.user.name}` : ""} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Here's how today's weather affects your body
          </p>
        </div>

        {!location && !loading && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">📍 Set your location</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Enter your ZIP code or city to get your personalized forecast.
              </p>
              <form onSubmit={handleZipSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="ZIP code or city (e.g. 60601 or Chicago, IL)"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md text-sm bg-white"
                  autoFocus
                />
                <Button type="submit" disabled={zipSearching}>
                  {zipSearching ? "…" : "Go"}
                </Button>
              </form>
              {zipError && <p className="text-sm text-red-600 mt-2">{zipError}</p>}
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && weather && conditions !== null && conditions.length === 0 && !todayLog && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🩺</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-amber-900">Personalize your forecast</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Tell us your health conditions and we'll show you how today's weather affects <em>your</em> body specifically.
                  </p>
                  <a href="/settings" className="inline-block mt-2 text-xs font-semibold text-amber-800 underline underline-offset-2">
                    Add my conditions →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && weather && (
          <>
            <BodyWeatherCard
              risks={risks}
              locationLabel={location?.label}
              temperature={weather.obs?.temperature}
              condition={weather.obs?.wxPhraseLong}
            />

            {weather.forecast && (
              <Card className="overflow-visible">
                <CardHeader>
                  <CardTitle className="text-base">7-Day Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1">
                    {weather.forecast.dayOfWeek.slice(0, 7).map((day, i) => {
                      const dpIdx = i * 2;
                      const genericDay = scoreFromIndices({
                        achePainCategory: weather.achePain?.category?.[dpIdx] ?? null,
                        achePainIndex: weather.achePain?.index?.[dpIdx] ?? null,
                        breathingCategory: weather.breathing?.category?.[dpIdx] ?? null,
                        breathingIndex: weather.breathing?.index?.[dpIdx] ?? null,
                        pollenCategory: weather.pollen?.category?.[dpIdx] ?? null,
                        pollenIndex: weather.pollen?.index?.[dpIdx] ?? null,
                      });
                      const dayRisks = conditions && conditions.length > 0
                        ? personalizeRisksBySymptoms(conditions, genericDay)
                        : genericDay;
                      const dayRisk = worstRisk(dayRisks.map(r => r.risk));
                      const dotClass = riskDot(dayRisk);
                      const riskLabel = dayRisk === "LOW" ? "Low" : dayRisk === "MODERATE" ? "Mod" : dayRisk === "HIGH" ? "High" : "V.Hi";
                      const isSelected = selectedForecastDay === i;

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedForecastDay(isSelected ? null : i)}
                          className={cn(
                            "text-center py-1.5 rounded-lg transition-colors w-full",
                            isSelected ? "bg-gray-100 ring-1 ring-gray-300" : "hover:bg-gray-50"
                          )}
                        >
                          <p className="text-xs font-medium text-muted-foreground">{day.slice(0, 3)}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">H</p>
                          <p className="text-sm font-semibold">
                            {weather.forecast!.temperatureMax[i] ?? "–"}°
                          </p>
                          <p className="text-[10px] text-muted-foreground">L</p>
                          <p className="text-xs text-muted-foreground">
                            {weather.forecast!.temperatureMin[i] ?? "–"}°
                          </p>
                          {(weather.forecast!.precipChance[i] ?? 0) > 0 && (
                            <p className="text-[10px] text-blue-500 mt-0.5">
                              {weather.forecast!.precipChance[i]}%
                            </p>
                          )}
                          <div className="mt-1.5 flex flex-col items-center gap-0.5">
                            <ForecastDot dotClass={dayRisk !== "LOW" ? dotClass : "bg-green-400"} />
                            <span className={cn("text-[9px] font-medium leading-none mt-0.5", {
                              "text-green-600": dayRisk === "LOW",
                              "text-yellow-600": dayRisk === "MODERATE",
                              "text-orange-500": dayRisk === "HIGH",
                              "text-red-600": dayRisk === "VERY HIGH",
                            })}>{riskLabel}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tap-to-expand detail panel */}
                  {selectedForecastDay !== null && (() => {
                    const i = selectedForecastDay;
                    const dpIdx = i * 2;
                    const genericDay = scoreFromIndices({
                      achePainCategory: weather.achePain?.category?.[dpIdx] ?? null,
                      achePainIndex: weather.achePain?.index?.[dpIdx] ?? null,
                      breathingCategory: weather.breathing?.category?.[dpIdx] ?? null,
                      breathingIndex: weather.breathing?.index?.[dpIdx] ?? null,
                      pollenCategory: weather.pollen?.category?.[dpIdx] ?? null,
                      pollenIndex: weather.pollen?.index?.[dpIdx] ?? null,
                    });
                    const dayRisks = conditions && conditions.length > 0
                      ? personalizeRisksBySymptoms(conditions, genericDay)
                      : genericDay;
                    const dayRisk = worstRisk(dayRisks.map(r => r.risk));
                    const elevated = dayRisks.filter(r => r.risk !== "LOW");
                    return (
                      <div className="mt-3 rounded-lg bg-gray-50 border px-3 py-2.5 text-sm">
                        <p className="font-semibold text-xs mb-1.5">
                          {weather.forecast!.dayOfWeek[i]} — Body impact:&nbsp;
                          <span className={cn({
                            "text-green-600": dayRisk === "LOW",
                            "text-yellow-600": dayRisk === "MODERATE",
                            "text-orange-500": dayRisk === "HIGH",
                            "text-red-600": dayRisk === "VERY HIGH",
                          })}>{dayRisk}</span>
                        </p>
                        {elevated.length > 0
                          ? elevated.map((r) => (
                              <p key={r.symptom} className="text-xs text-muted-foreground">
                                {r.icon} {r.symptom}: <span className={cn("font-medium", {
                                  "text-yellow-600": r.risk === "MODERATE",
                                  "text-orange-500": r.risk === "HIGH",
                                  "text-red-600": r.risk === "VERY HIGH",
                                })}>{r.risk}</span>
                              </p>
                            ))
                          : <p className="text-xs text-muted-foreground">No elevated body impacts expected.</p>
                        }
                      </div>
                    );
                  })()}

                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-3 flex-wrap">
                    <span>Tap a day for details.</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-300 inline-block" /> Low</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Moderate</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> High</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Very High</span>
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
        <p className="text-[11px] text-muted-foreground/40 text-center pt-2 flex items-center justify-center gap-1.5">
          Weather data powered by <TwcLogo />
        </p>
      </main>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
