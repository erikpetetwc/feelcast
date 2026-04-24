"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { conditionsToSymptomIds } from "@/lib/condition-symptom-map";
import { SYMPTOM_GROUPS, SYMPTOM_BY_ID } from "@/lib/symptoms";

function SymptomButton({
  id,
  label,
  icon,
  selected,
  onToggle,
}: {
  id: string;
  label: string;
  icon: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium text-left transition-colors h-full ${
        selected
          ? "bg-blue-50 border-blue-300 text-blue-800"
          : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="leading-tight">{label}</span>
    </button>
  );
}

const SEVERITY_LABELS = ["", "Barely noticeable", "Mild", "Moderate", "Severe", "Debilitating"];

function SeverityList({
  items,
  selectedIds,
  severities,
  onSeverity,
}: {
  items: { id: string; label: string; icon: string }[];
  selectedIds: Set<string>;
  severities: Record<string, number>;
  onSeverity: (id: string, v: number) => void;
}) {
  const selectedItems = items.filter((s) => selectedIds.has(s.id));
  if (selectedItems.length === 0) return null;
  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      {selectedItems.map((s) => {
        const sev = severities[s.id] ?? 3;
        return (
          <div key={s.id} className="flex items-center gap-3">
            <span className="text-base w-5 shrink-0">{s.icon}</span>
            <span className="text-xs font-medium text-blue-800 w-28 shrink-0">{s.label}</span>
            <input
              type="range" min={1} max={5} step={1}
              value={sev}
              onChange={(e) => onSeverity(s.id, parseInt(e.target.value))}
              className="flex-1 accent-blue-600"
            />
            <span className="text-xs text-muted-foreground w-28 shrink-0">{sev} — {SEVERITY_LABELS[sev]}</span>
          </div>
        );
      })}
    </div>
  );
}

function LogPageInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [severities, setSeverities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [conditions, setConditions] = useState<string[] | null>(null);
  const [logDate, setLogDate] = useState<string>(
    () => searchParams.get("date") ?? new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    const stored = localStorage.getItem("bw_location");
    if (stored) setLocation(JSON.parse(stored));
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((user) => setConditions(Array.isArray(user.conditions) ? user.conditions : []))
      .catch(() => setConditions([]));
  }, [status]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSeverities((s) => { const n = { ...s }; delete n[id]; return n; });
      } else {
        next.add(id);
        setSeverities((s) => ({ ...s, [id]: 3 }));
      }
      return next;
    });
  }

  async function handleClearDay() {
    if (!window.confirm(`Clear all logged symptoms for ${logDate}?`)) return;
    setClearing(true);
    await fetch(`/api/logs?date=${logDate}`, { method: "DELETE" });
    setClearing(false);
    setSelected(new Set());
    setNotes("");
    setSeverities({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) return;
    setSaving(true);
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symptoms: Array.from(selected).map((id) => ({ id, severity: severities[id] ?? 3 })),
        severity: Math.round(
          Array.from(selected).reduce((sum, id) => sum + (severities[id] ?? 3), 0) / selected.size
        ),
        notes: notes || null,
        lat: location?.lat ?? 0,
        lon: location?.lon ?? 0,
        loggedAt: logDate !== new Date().toISOString().slice(0, 10) ? logDate : undefined,
      }),
    });
    setSaving(false);
    setSaved(true);
    setSelected(new Set());
    setNotes("");
    setSeverities({});
    setTimeout(() => setSaved(false), 3000);
  }

  if (status === "loading") return null;

  const mySymptomIds = conditions ? conditionsToSymptomIds(conditions) : [];
  const mySymptomItems = mySymptomIds.map((id) => SYMPTOM_BY_ID[id]).filter(Boolean);
  // Filter out "My Conditions" symptoms from the general groups to avoid duplication
  const mySymptomSet = new Set(mySymptomIds);

  return (
    <div>
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <h1 className="text-2xl font-bold">How did you feel?</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Track your actual symptoms day by day — your body's truth, not just a forecast
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <label className="text-xs text-muted-foreground">Logging for</label>
            <input
              type="date"
              value={logDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setLogDate(e.target.value)}
              className="px-2 py-1.5 border rounded-md text-sm bg-white"
            />
            <button
              type="button"
              onClick={handleClearDay}
              disabled={clearing}
              className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2"
            >
              {clearing ? "Clearing…" : "Clear this day"}
            </button>
          </div>
        </div>
        <div className="mb-6" />

        {conditions !== null && conditions.length === 0 && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="text-xl mt-0.5">🩺</span>
            <div>
              <p className="text-sm font-semibold text-amber-900">Make this personal</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Add your health conditions in Settings and we'll put your relevant symptoms front and center every time you log.
              </p>
              <a href="/settings" className="inline-block mt-1.5 text-xs font-semibold text-amber-800 underline underline-offset-2">
                Go to Settings →
              </a>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mySymptomItems.length > 0 && (
            <Card className="border-blue-200 overflow-visible">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                  My Conditions
                </CardTitle>
                <p className="text-xs text-muted-foreground">Based on your health profile — tap anything that's flaring today</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {mySymptomItems.map((s) => (
                    <SymptomButton
                      key={s.id}
                      id={s.id}
                      label={s.label}
                      icon={s.icon}
                      selected={selected.has(s.id)}
                      onToggle={() => toggle(s.id)}
                    />
                  ))}
                </div>
                <SeverityList
                  items={mySymptomItems}
                  selectedIds={selected}
                  severities={severities}
                  onSeverity={(id, v) => setSeverities((prev) => ({ ...prev, [id]: v }))}
                />
              </CardContent>
            </Card>
          )}

          {SYMPTOM_GROUPS.map((group) => {
            const items = mySymptomItems.length > 0
              ? group.items.filter((s) => !mySymptomSet.has(s.id))
              : group.items;
            if (items.length === 0) return null;
            return (
              <Card key={group.group} className="overflow-visible">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.group}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {items.map((s) => (
                      <SymptomButton
                        key={s.id}
                        id={s.id}
                        label={s.label}
                        icon={s.icon}
                        selected={selected.has(s.id)}
                        onToggle={() => toggle(s.id)}
                      />
                    ))}
                  </div>
                  <SeverityList
                    items={items}
                    selectedIds={selected}
                    severities={severities}
                    onSeverity={(id, v) => setSeverities((prev) => ({ ...prev, [id]: v }))}
                  />
                </CardContent>
              </Card>
            );
          })}

          <Card className="overflow-visible">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Notes <span className="normal-case font-normal">(optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any other details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={selected.size === 0 || saving}>
            {saving ? "Saving…" : saved ? "✓ Logged!" : `Log ${selected.size > 0 ? `${selected.size} symptom${selected.size > 1 ? "s" : ""}` : "symptoms"}`}
          </Button>
        </form>
      </main>
    </div>
  );
}

export default function LogPage() {
  return (
    <Suspense>
      <LogPageInner />
    </Suspense>
  );
}
