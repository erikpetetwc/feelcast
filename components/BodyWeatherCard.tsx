"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/RiskBadge";
import { type BodyRisk, type RiskLevel } from "@/lib/body-score";

interface Props {
  risks: BodyRisk[];
  locationLabel?: string;
  temperature?: number | null;
  condition?: string | null;
  personalized?: boolean;
}

const RISK_LEVELS: RiskLevel[] = ["VERY HIGH", "HIGH", "MODERATE", "LOW"];

export function BodyWeatherCard({ risks, locationLabel, temperature, condition, personalized }: Props) {
  const elevated = risks.filter((r) => r.risk !== "LOW");
  const low = risks.filter((r) => r.risk === "LOW");
  const groups = RISK_LEVELS
    .map((level) => ({ level, items: risks.filter((r) => r.risk === level) }))
    .filter((g) => g.items.length > 0 && g.level !== "LOW");

  return (
    <Card className="w-full overflow-visible">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Body Impact</CardTitle>
          {locationLabel && (
            <span className="text-sm text-muted-foreground">📍 {locationLabel}</span>
          )}
        </div>
        {(temperature != null || condition) && (
          <p className="text-sm text-muted-foreground">
            {temperature != null && `${temperature}°F`}
            {temperature != null && condition && " · "}
            {condition}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {elevated.length === 0 && !personalized ? (
          <div className="flex items-center gap-3 py-1">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-medium">All clear today</p>
              <p className="text-xs text-muted-foreground">No elevated weather impacts expected</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {elevated.length === 0 && personalized && (
              <div className="flex items-center gap-3 py-1">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-sm font-medium">All clear today</p>
                  <p className="text-xs text-muted-foreground">No elevated impacts for your conditions</p>
                </div>
              </div>
            )}
            {groups.map(({ level, items }) => (
              <div key={level}>
                <div className="mb-2">
                  <RiskBadge risk={level} />
                </div>
                <div className="space-y-0">
                  {items.map((r) => (
                    <div key={r.symptom} className="flex items-start gap-2.5 py-2 border-b last:border-0">
                      <span className="text-xl leading-none mt-0.5 shrink-0">{r.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">{r.symptom}</p>
                        <p className="text-xs text-muted-foreground leading-snug mt-0.5">{r.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {personalized && low.length > 0 && (
              <div className={elevated.length > 0 ? "border-t pt-3" : undefined}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Favorable today</p>
                <div className="space-y-1">
                  {low.map((r) => (
                    <div key={r.symptom} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-base leading-none">{r.icon}</span>
                      <span>{r.symptom}</span>
                      <span className="ml-auto text-green-600 font-medium">✓ Low</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
