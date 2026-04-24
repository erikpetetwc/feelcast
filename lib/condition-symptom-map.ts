import { type BodyRisk, type RiskLevel, RISK_ORDER } from "./body-score";

export type RiskGroup = "ache" | "breathing" | "pollen" | "pressure" | "uv";

export interface ConditionProfile {
  label: string;
  icon: string;
  symptoms: string[];
  riskGroups: RiskGroup[];
}

export const CONDITION_MAP: Record<string, ConditionProfile> = {
  ra: {
    label: "Rheumatoid Arthritis",
    icon: "🦾",
    symptoms: ["ra_flare", "joint_ache", "muscle_stiffness", "fatigue"],
    riskGroups: ["ache", "pressure"],
  },
  osteoarthritis: {
    label: "Osteoarthritis",
    icon: "🦴",
    symptoms: ["joint_ache", "back_pain", "muscle_stiffness"],
    riskGroups: ["ache"],
  },
  fibromyalgia: {
    label: "Fibromyalgia",
    icon: "⚡",
    symptoms: ["fibro_flare", "muscle_stiffness", "fatigue", "brain_fog"],
    riskGroups: ["ache", "pressure"],
  },
  migraines: {
    label: "Chronic Migraines",
    icon: "🤕",
    symptoms: ["migraine", "headache", "nausea", "dizziness"],
    riskGroups: ["pressure", "uv"],
  },
  asthma: {
    label: "Asthma",
    icon: "🫁",
    symptoms: ["asthma_flare", "breathing"],
    riskGroups: ["breathing", "pollen"],
  },
  copd: {
    label: "COPD",
    icon: "💨",
    symptoms: ["breathing", "fatigue"],
    riskGroups: ["breathing"],
  },
  lupus: {
    label: "Lupus",
    icon: "🌙",
    symptoms: ["joint_ache", "fatigue", "skin"],
    riskGroups: ["uv", "ache"],
  },
  ms: {
    label: "Multiple Sclerosis",
    icon: "🧠",
    symptoms: ["fatigue", "muscle_stiffness", "brain_fog"],
    riskGroups: ["ache"],
  },
  anxiety: {
    label: "Anxiety",
    icon: "😰",
    symptoms: ["anxiety", "mood", "fatigue"],
    riskGroups: ["pressure"],
  },
  seasonal_allergies: {
    label: "Seasonal Allergies",
    icon: "🌿",
    symptoms: ["sneezing", "itchy_eyes", "sinus", "breathing"],
    riskGroups: ["pollen", "breathing"],
  },
  eczema: {
    label: "Eczema / Psoriasis",
    icon: "🧴",
    symptoms: ["eczema_flare", "skin"],
    riskGroups: ["uv"],
  },
  ibd: {
    label: "IBD / Crohn's",
    icon: "🫀",
    symptoms: ["fatigue", "mood", "low_energy"],
    riskGroups: ["pressure"],
  },
};

const RISK_GROUP_TO_SYMPTOM: Record<RiskGroup, string> = {
  ache: "Joint & Body Aches",
  breathing: "Breathing Difficulty",
  pollen: "Allergy / Sinus",
  pressure: "Headache / Migraine",
  uv: "Sun Fatigue",
};

/** Personalize risks based on saved symptom IDs (new model) */
export function personalizeRisksBySymptoms(symptomIds: string[], genericRisks: BodyRisk[]): BodyRisk[] {
  if (symptomIds.length === 0) return genericRisks;
  const byName = new Map(genericRisks.map((r) => [r.symptom, r]));
  const relevantGroups = new Set<RiskGroup>();
  for (const id of symptomIds) {
    for (const g of (SYMPTOM_TO_RISK_GROUPS[id] ?? [])) relevantGroups.add(g);
  }
  if (relevantGroups.size === 0) return genericRisks;
  return [...relevantGroups]
    .map((g) => byName.get(RISK_GROUP_TO_SYMPTOM[g]))
    .filter((r): r is BodyRisk => r !== undefined)
    .sort((a, b) => RISK_ORDER[b.risk] - RISK_ORDER[a.risk]);
}

/** Map user conditions to personalized BodyRisk rows for the dashboard */
export function personalizeRisks(conditionIds: string[], genericRisks: BodyRisk[]): BodyRisk[] {
  if (conditionIds.length === 0) return genericRisks;

  const bySymptom = new Map(genericRisks.map((r) => [r.symptom, r]));
  const result: BodyRisk[] = [];

  for (const condId of conditionIds) {
    const cond = CONDITION_MAP[condId];
    if (!cond) continue;

    // Find worst-scoring risk group for this condition
    let best: BodyRisk | null = null;
    for (const group of cond.riskGroups) {
      const r = bySymptom.get(RISK_GROUP_TO_SYMPTOM[group]);
      if (r && (!best || RISK_ORDER[r.risk] > RISK_ORDER[best.risk])) {
        best = r;
      }
    }

    if (best) {
      result.push({ ...best, symptom: cond.label, icon: cond.icon });
    }
  }

  return result.sort((a, b) => RISK_ORDER[b.risk] - RISK_ORDER[a.risk]);
}

// Reverse map: symptom ID → relevant risk groups (built from CONDITION_MAP)
const SYMPTOM_TO_RISK_GROUPS: Record<string, RiskGroup[]> = {};
for (const cond of Object.values(CONDITION_MAP)) {
  for (const symptomId of cond.symptoms) {
    if (!SYMPTOM_TO_RISK_GROUPS[symptomId]) SYMPTOM_TO_RISK_GROUPS[symptomId] = [];
    for (const group of cond.riskGroups) {
      if (!SYMPTOM_TO_RISK_GROUPS[symptomId].includes(group)) {
        SYMPTOM_TO_RISK_GROUPS[symptomId].push(group);
      }
    }
  }
}

/**
 * Score each logged symptom against the generic TWC body risks.
 * Handles both old format (string[]) and new format ({ id, severity }[]).
 */
export function scoreLoggedSymptoms(
  rawSymptoms: unknown,
  genericRisks: BodyRisk[],
  symptomMeta: Record<string, { label: string; icon: string }>
): BodyRisk[] {
  // Normalise to string[]
  let symptomIds: string[] = [];
  if (Array.isArray(rawSymptoms)) {
    symptomIds = rawSymptoms.map((s) =>
      typeof s === "string" ? s : (s as { id: string }).id
    );
  }

  const byGroup = new Map<RiskGroup, BodyRisk>(
    (Object.entries(RISK_GROUP_TO_SYMPTOM) as [RiskGroup, string][]).map(([group, name]) => {
      const r = genericRisks.find((x) => x.symptom === name);
      return r ? [group, r] : null;
    }).filter((x): x is [RiskGroup, BodyRisk] => x !== null)
  );

  const result: BodyRisk[] = [];

  for (const id of symptomIds) {
    const meta = symptomMeta[id];
    if (!meta) continue;

    const groups: RiskGroup[] = SYMPTOM_TO_RISK_GROUPS[id] ?? ["ache"];

    let best: BodyRisk | null = null;
    for (const group of groups) {
      const r = byGroup.get(group);
      if (r && (!best || RISK_ORDER[r.risk] > RISK_ORDER[best.risk])) best = r;
    }

    if (best) result.push({ ...best, symptom: meta.label, icon: meta.icon });
  }

  return result.sort((a, b) => RISK_ORDER[b.risk] - RISK_ORDER[a.risk]);
}

/** Return unique symptom IDs for all user conditions (for log page pre-population) */
export function conditionsToSymptomIds(conditionIds: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of conditionIds) {
    const profile = CONDITION_MAP[id];
    if (!profile) continue;
    for (const s of profile.symptoms) {
      if (!seen.has(s)) {
        seen.add(s);
        result.push(s);
      }
    }
  }
  return result;
}
