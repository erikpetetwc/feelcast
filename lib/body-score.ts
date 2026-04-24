export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "VERY HIGH";

export interface BodyRisk {
  symptom: string;
  risk: RiskLevel;
  icon: string;
  reason: string;
  index?: number;
}

export const RISK_ORDER: Record<RiskLevel, number> = {
  "VERY HIGH": 3,
  HIGH: 2,
  MODERATE: 1,
  LOW: 0,
};

export const CATEGORY_MAP: Record<string, RiskLevel> = {
  minimal: "LOW",
  "very good": "LOW",
  good: "LOW",
  low: "LOW",
  moderate: "MODERATE",
  fair: "MODERATE",
  poor: "HIGH",
  high: "HIGH",
  "very high": "VERY HIGH",
  "extremely high": "VERY HIGH",
};

export function categoryToRisk(category: string | null | undefined): RiskLevel {
  if (!category) return "LOW";
  return CATEGORY_MAP[category.toLowerCase()] ?? "MODERATE";
}

export function riskColor(risk: RiskLevel) {
  switch (risk) {
    case "LOW": return "green";
    case "MODERATE": return "yellow";
    case "HIGH": return "orange";
    case "VERY HIGH": return "red";
  }
}

export function riskDot(risk: RiskLevel) {
  switch (risk) {
    case "LOW": return "bg-green-400";
    case "MODERATE": return "bg-yellow-400";
    case "HIGH": return "bg-orange-400";
    case "VERY HIGH": return "bg-red-500";
  }
}

export function worstRisk(risks: RiskLevel[]): RiskLevel {
  return risks.reduce((a, b) => RISK_ORDER[a] >= RISK_ORDER[b] ? a : b, "LOW" as RiskLevel);
}

export function scoreFromIndices(params: {
  achePainCategory?: string | null;
  achePainIndex?: number | null;
  breathingCategory?: string | null;
  breathingIndex?: number | null;
  pollenCategory?: string | null;
  pollenIndex?: number | null;
  pressureChange?: number | null;
  uvIndex?: number | null;
  temperature?: number | null;
  humidity?: number | null;
}): BodyRisk[] {
  const risks: BodyRisk[] = [];

  // ── Ache & Pain (TWC index + temperature/humidity context) ──────────────────
  const achePain = categoryToRisk(params.achePainCategory);
  risks.push({
    symptom: "Joint & Body Aches",
    risk: achePain,
    icon: "🦴",
    reason: acheReason(params.achePainCategory, params.temperature, params.humidity),
    index: params.achePainIndex ?? undefined,
  });

  // ── Breathing (TWC index) ───────────────────────────────────────────────────
  const breathing = categoryToRisk(params.breathingCategory);
  risks.push({
    symptom: "Breathing Difficulty",
    risk: breathing,
    icon: "🫁",
    reason: descForCategory(params.breathingCategory, "breathing conditions"),
    index: params.breathingIndex ?? undefined,
  });

  // ── Pollen / Allergy (TWC index) ────────────────────────────────────────────
  const pollen = categoryToRisk(params.pollenCategory);
  risks.push({
    symptom: "Allergy / Sinus",
    risk: pollen,
    icon: "🌿",
    reason: descForCategory(params.pollenCategory, "pollen levels"),
    index: params.pollenIndex ?? undefined,
  });

  // ── Barometric pressure → headache/migraine ─────────────────────────────────
  // Research: falling pressure is the primary trigger. Drops ≥ 0.15 inHg (5 hPa)
  // strongly associated with migraines. Rising pressure is a weaker trigger.
  const pressureChange = params.pressureChange ?? 0;
  const absPressure = Math.abs(pressureChange);
  const isDrop = pressureChange < -0.01;

  let headacheRisk: RiskLevel = "LOW";
  if (isDrop) {
    if (absPressure >= 0.15) headacheRisk = "VERY HIGH";
    else if (absPressure >= 0.09) headacheRisk = "HIGH";
    else if (absPressure >= 0.05) headacheRisk = "MODERATE";
  } else if (pressureChange > 0.01) {
    // Rising pressure: weaker trigger, higher threshold
    if (absPressure >= 0.18) headacheRisk = "HIGH";
    else if (absPressure >= 0.10) headacheRisk = "MODERATE";
  }

  const pressureIndex = Math.min(100, Math.round((absPressure / 0.15) * 100));
  risks.push({
    symptom: "Headache / Migraine",
    risk: headacheRisk,
    icon: "🤕",
    reason: pressureReason(pressureChange),
    index: pressureIndex,
  });

  // ── UV index → sun fatigue & skin ──────────────────────────────────────────
  // UV 6-7: moderate risk; 8+: high risk (WHO scale)
  const uv = params.uvIndex ?? 0;
  const fatigueRisk: RiskLevel = uv >= 8 ? "HIGH" : uv >= 6 ? "MODERATE" : "LOW";
  const uvIndex100 = Math.min(100, Math.round((uv / 11) * 100));
  risks.push({
    symptom: "Sun Fatigue",
    risk: fatigueRisk,
    icon: "☀️",
    reason: uv >= 8
      ? `High UV (${uv}) — prolonged sun exposure can cause fatigue and flares`
      : uv >= 6
      ? `Moderate UV (${uv}) — limit sun exposure, especially midday`
      : `UV index ${uv} — low risk`,
    index: uvIndex100,
  });

  return risks.sort((a, b) => RISK_ORDER[b.risk] - RISK_ORDER[a.risk]);
}

function pressureReason(pressureChange: number): string {
  if (pressureChange < -0.01) {
    const abs = Math.abs(pressureChange).toFixed(2);
    return pressureChange <= -0.15
      ? `Significant pressure drop (${abs} inHg) — strong migraine trigger`
      : pressureChange <= -0.09
      ? `Pressure falling (${abs} inHg) — common headache trigger`
      : `Slight pressure drop (${abs} inHg) — may affect sensitive individuals`;
  }
  if (pressureChange > 0.01) {
    return `Pressure rising (${pressureChange.toFixed(2)} inHg) — generally stable`;
  }
  return "Stable atmospheric pressure — favorable for headaches";
}

function acheReason(
  category: string | null | undefined,
  temperature: number | null | undefined,
  humidity: number | null | undefined
): string {
  const base = descForCategory(category, "ache and pain conditions");
  const factors: string[] = [];

  if (temperature != null && temperature < 40)
    factors.push(`cold (${temperature}°F)`);
  if (humidity != null && humidity > 80)
    factors.push(`high humidity (${humidity}%)`);
  else if (humidity != null && humidity < 40)
    factors.push(`low humidity (${humidity}%)`);

  return factors.length > 0 ? `${base} — ${factors.join(", ")}` : base;
}

function descForCategory(category: string | null | undefined, symptom: string): string {
  if (!category) return "Conditions are favorable";
  const lower = category.toLowerCase();
  if (lower === "minimal" || lower === "low" || lower === "very good" || lower === "good")
    return `Low ${symptom} expected`;
  if (lower === "moderate") return `Moderate ${symptom} — consider precautions`;
  return `${category} ${symptom} — take care today`;
}
