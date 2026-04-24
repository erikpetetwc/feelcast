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
}): BodyRisk[] {
  const risks: BodyRisk[] = [];

  const achePain = categoryToRisk(params.achePainCategory);
  risks.push({
    symptom: "Joint & Body Aches",
    risk: achePain,
    icon: "🦴",
    reason: descForCategory(params.achePainCategory, "ache and pain conditions"),
    index: params.achePainIndex ?? undefined,
  });

  const breathing = categoryToRisk(params.breathingCategory);
  risks.push({
    symptom: "Breathing Difficulty",
    risk: breathing,
    icon: "🫁",
    reason: descForCategory(params.breathingCategory, "breathing conditions"),
    index: params.breathingIndex ?? undefined,
  });

  const pollen = categoryToRisk(params.pollenCategory);
  risks.push({
    symptom: "Allergy / Sinus",
    risk: pollen,
    icon: "🌿",
    reason: descForCategory(params.pollenCategory, "pollen levels"),
    index: params.pollenIndex ?? undefined,
  });

  const pressureChange = params.pressureChange ?? 0;
  let headacheRisk: RiskLevel = "LOW";
  if (Math.abs(pressureChange) >= 0.15) headacheRisk = "VERY HIGH";
  else if (Math.abs(pressureChange) >= 0.10) headacheRisk = "HIGH";
  else if (Math.abs(pressureChange) >= 0.05) headacheRisk = "MODERATE";
  const pressureIndex = Math.min(100, Math.round((Math.abs(pressureChange) / 0.15) * 100));
  risks.push({
    symptom: "Headache / Migraine",
    risk: headacheRisk,
    icon: "🤕",
    reason:
      pressureChange < -0.01
        ? `Pressure dropping (${pressureChange.toFixed(2)} inHg)`
        : pressureChange > 0.01
        ? `Pressure rising (${pressureChange.toFixed(2)} inHg)`
        : "Stable atmospheric pressure",
    index: pressureIndex,
  });

  const uv = params.uvIndex ?? 0;
  const fatigueRisk: RiskLevel = uv >= 8 ? "HIGH" : uv >= 6 ? "MODERATE" : "LOW";
  const uvIndex100 = Math.min(100, Math.round((uv / 11) * 100));
  risks.push({
    symptom: "Sun Fatigue",
    risk: fatigueRisk,
    icon: "☀️",
    reason: `UV index ${uv}${uv >= 6 ? " — limit sun exposure" : ""}`,
    index: uvIndex100,
  });

  return risks.sort((a, b) => RISK_ORDER[b.risk] - RISK_ORDER[a.risk]);
}

function descForCategory(category: string | null | undefined, symptom: string): string {
  if (!category) return "Conditions are favorable";
  const lower = category.toLowerCase();
  if (lower === "minimal" || lower === "low" || lower === "very good" || lower === "good")
    return `${category} ${symptom} expected`;
  if (lower === "moderate") return `Moderate ${symptom} — consider precautions`;
  return `${category} ${symptom} — take care today`;
}
