"use client";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths, getDay,
} from "date-fns";
import { SYMPTOM_BY_ID } from "@/lib/symptoms";

interface RawLog {
  id: string;
  loggedAt: string;
  symptoms: unknown;
  severity: number;
  notes?: string | null;
  weatherSnapshot: {
    temperature?: number | null;
    relativeHumidity?: number | null;
    pressureChange?: number | null;
    wxPhraseLong?: string | null;
    uvIndex?: number | null;
  } | null;
}

interface SymptomEntry { id: string; severity: number }

function parseSymptoms(raw: unknown): SymptomEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) =>
    typeof s === "string"
      ? { id: s, severity: 3 }
      : { id: (s as SymptomEntry).id, severity: (s as SymptomEntry).severity ?? 3 }
  );
}

function computeDayScore(logs: RawLog[]): number | null {
  if (logs.length === 0) return null;
  const allEntries = logs.flatMap((l) => parseSymptoms(l.symptoms));
  if (allEntries.length === 0) return null;
  const uniqueCount = new Set(allEntries.map((e) => e.id)).size;
  const avgSev = allEntries.reduce((s, e) => s + e.severity, 0) / allEntries.length;
  // Boost score slightly for many symptoms (3+ adds 0.5, 6+ adds 1)
  const spreadBonus = Math.min(1, Math.floor(uniqueCount / 3) * 0.5);
  return Math.min(5, avgSev + spreadBonus);
}

function scoreToStyle(score: number | null): { bg: string; text: string; label: string } {
  if (score === null) return { bg: "", text: "text-muted-foreground", label: "" };
  if (score < 2) return { bg: "bg-green-100 border-green-300", text: "text-green-800", label: "Good" };
  if (score < 3) return { bg: "bg-yellow-100 border-yellow-300", text: "text-yellow-800", label: "Mild" };
  if (score < 4) return { bg: "bg-orange-100 border-orange-300", text: "text-orange-800", label: "Bad" };
  return { bg: "bg-red-100 border-red-300", text: "text-red-800", label: "Severe" };
}

const DOW_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function HistoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [logs, setLogs] = useState<RawLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const to = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    fetch(`/api/logs?from=${from}&to=${to}&limit=500`)
      .then((r) => r.json())
      .then((data) => { setLogs(Array.isArray(data) ? data : []); setLoading(false); });
  }, [status, currentMonth]);

  // Group logs by date string
  const logsByDate = useMemo(() => {
    const map: Record<string, RawLog[]> = {};
    for (const log of logs) {
      const key = format(new Date(log.loggedAt), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(log);
    }
    return map;
  }, [logs]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Leading blank cells so calendar starts on Monday
  const leadingBlanks = useMemo(() => {
    const dow = getDay(startOfMonth(currentMonth)); // 0=Sun
    return (dow + 6) % 7; // convert to Mon=0
  }, [currentMonth]);

  const selectedDayKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;
  const selectedLogs = selectedDayKey ? (logsByDate[selectedDayKey] ?? []) : [];

  if (status === "loading") return null;

  return (
    <div>
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Symptom History</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            How you actually felt, day by day
          </p>
        </div>

        <Card className="overflow-visible">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
                ←
              </Button>
              <CardTitle className="text-base">{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <Button
                variant="ghost" size="sm"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                disabled={format(addMonths(currentMonth, 1), "yyyy-MM") > format(new Date(), "yyyy-MM")}
              >
                →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {DOW_LABELS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {loading ? (
              <div className="h-48 bg-gray-100 animate-pulse rounded" />
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {/* Leading blank cells */}
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}

                {daysInMonth.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayLogs = logsByDate[key] ?? [];
                  const score = computeDayScore(dayLogs);
                  const style = scoreToStyle(score);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const today = isToday(day);

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day)}
                      className={[
                        "relative flex flex-col items-center justify-center rounded-lg border py-2 text-sm transition-all",
                        score !== null ? style.bg : "border-transparent hover:bg-muted/40",
                        isSelected ? "ring-2 ring-blue-500 ring-offset-1" : "",
                        today ? "font-bold" : "",
                      ].join(" ")}
                    >
                      <span className={score !== null ? style.text : ""}>{format(day, "d")}</span>
                      {score !== null && (
                        <span className={`text-[9px] leading-none mt-0.5 ${style.text} opacity-80`}>
                          {style.label}
                        </span>
                      )}
                      {today && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <span className="text-xs text-muted-foreground">Feel rating:</span>
              {[
                { bg: "bg-green-200", label: "Good" },
                { bg: "bg-yellow-200", label: "Mild" },
                { bg: "bg-orange-200", label: "Bad" },
                { bg: "bg-red-200", label: "Severe" },
              ].map(({ bg, label }) => (
                <span key={label} className="flex items-center gap-1 text-xs">
                  <span className={`w-3 h-3 rounded ${bg} inline-block`} /> {label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Day detail panel */}
        {selectedDay && (
          <Card className="overflow-visible">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {format(selectedDay, "EEEE, MMMM d")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLogs.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Nothing logged for this day.</p>
                  <a
                    href={`/log?date=${format(selectedDay, "yyyy-MM-dd")}`}
                    className="inline-block mt-2 text-sm text-blue-600 underline underline-offset-2"
                  >
                    Log symptoms for this day →
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedLogs.map((log) => {
                    const entries = parseSymptoms(log.symptoms);
                    const style = scoreToStyle(computeDayScore([log]));
                    return (
                      <div key={log.id} className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {entries.map((e) => {
                            const meta = SYMPTOM_BY_ID[e.id];
                            return (
                              <span
                                key={e.id}
                                className="flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1"
                              >
                                <span>{meta?.icon ?? "•"}</span>
                                <span className="font-medium">{meta?.label ?? e.id}</span>
                                <span className="text-muted-foreground ml-0.5">{e.severity}/5</span>
                              </span>
                            );
                          })}
                        </div>
                        {log.weatherSnapshot && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                            <span>🌡 Weather at log time:</span>
                            {log.weatherSnapshot.wxPhraseLong && <span>{log.weatherSnapshot.wxPhraseLong}</span>}
                            {log.weatherSnapshot.temperature != null && <span>{log.weatherSnapshot.temperature}°F</span>}
                            {log.weatherSnapshot.relativeHumidity != null && <span>{log.weatherSnapshot.relativeHumidity}% humidity</span>}
                            {log.weatherSnapshot.pressureChange != null && log.weatherSnapshot.pressureChange !== 0 && (
                              <span>
                                {log.weatherSnapshot.pressureChange > 0 ? "↑" : "↓"} pressure
                              </span>
                            )}
                          </p>
                        )}
                        {log.notes && (
                          <p className="text-xs text-muted-foreground italic">"{log.notes}"</p>
                        )}
                        <p className={`text-xs font-semibold ${style.text}`}>
                          Overall feel: {style.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
