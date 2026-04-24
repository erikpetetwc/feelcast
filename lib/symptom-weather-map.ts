export interface WeatherDriver {
  factor: string;
  direction: "worsens" | "improves";
  detail: string;
}

export interface SymptomWeatherProfile {
  label: string;
  drivers: WeatherDriver[];
}

export const SYMPTOM_WEATHER_MAP: Record<string, SymptomWeatherProfile> = {
  headache: {
    label: "Headache",
    drivers: [
      { factor: "Pressure drop", direction: "worsens", detail: "Rapid barometric pressure falls trigger tension and sinus headaches" },
      { factor: "High humidity", direction: "worsens", detail: "Humidity above 70% increases headache likelihood" },
      { factor: "Hot weather", direction: "worsens", detail: "Heat causes dehydration and dilates blood vessels" },
      { factor: "Stable pressure", direction: "improves", detail: "Steady barometric pressure reduces headache risk" },
      { factor: "Mild temperatures", direction: "improves", detail: "Cool, stable conditions are easiest on the head" },
    ],
  },
  migraine: {
    label: "Migraine",
    drivers: [
      { factor: "Pressure drop", direction: "worsens", detail: "Even small drops (0.05+ inHg) can trigger migraines in sensitive individuals" },
      { factor: "Bright sunlight / UV", direction: "worsens", detail: "High UV and glare are classic migraine triggers" },
      { factor: "Temperature swings", direction: "worsens", detail: "Rapid temp changes (10°F+ in 24h) stress the nervous system" },
      { factor: "Low humidity", direction: "improves", detail: "Drier air tends to reduce migraine frequency" },
      { factor: "Overcast / cloudy", direction: "improves", detail: "Reduced light intensity lowers photosensitivity triggers" },
    ],
  },
  joint_ache: {
    label: "Joint Aches",
    drivers: [
      { factor: "Pressure drop", direction: "worsens", detail: "Lower barometric pressure allows joint tissue to expand, increasing pain" },
      { factor: "Cold temperatures", direction: "worsens", detail: "Cold stiffens synovial fluid and tightens muscles around joints" },
      { factor: "High humidity", direction: "worsens", detail: "Humid conditions increase inflammation in joint tissue" },
      { factor: "Warm, dry weather", direction: "improves", detail: "Warmth keeps joints supple; low humidity reduces swelling" },
      { factor: "Stable pressure", direction: "improves", detail: "Consistent pressure means consistent joint fluid volume" },
    ],
  },
  ra_flare: {
    label: "RA Flare",
    drivers: [
      { factor: "Pressure drop", direction: "worsens", detail: "RA joints are highly sensitive to pressure changes — even modest drops worsen inflammation" },
      { factor: "Cold & damp", direction: "worsens", detail: "Cold humid air is the most common RA flare trigger" },
      { factor: "Temperature drop", direction: "worsens", detail: "Rapid cooling increases joint stiffness and morning pain" },
      { factor: "Warm stable weather", direction: "improves", detail: "Warm, dry, stable days typically reduce RA symptom burden" },
    ],
  },
  fibro_flare: {
    label: "Fibromyalgia Flare",
    drivers: [
      { factor: "Pressure drop", direction: "worsens", detail: "Fibromyalgia pain amplification is strongly correlated with falling pressure" },
      { factor: "Cold temperatures", direction: "worsens", detail: "Cold weather increases widespread muscle pain and tenderness" },
      { factor: "High humidity", direction: "worsens", detail: "Humidity exacerbates fatigue and diffuse pain" },
      { factor: "Weather instability", direction: "worsens", detail: "Any rapid weather change (front passage) can trigger flares" },
      { factor: "Warm, stable, low humidity", direction: "improves", detail: "Consistent warm dry conditions are the most favorable for fibro" },
    ],
  },
  back_pain: {
    label: "Back Pain",
    drivers: [
      { factor: "Cold temperatures", direction: "worsens", detail: "Cold causes muscle spasm and reduces flexibility in spinal tissues" },
      { factor: "Pressure drop", direction: "worsens", detail: "Disc and joint tissue expands slightly with pressure drops, increasing pain" },
      { factor: "High humidity", direction: "worsens", detail: "Damp conditions worsen inflammatory back conditions" },
      { factor: "Warm weather", direction: "improves", detail: "Warmth relaxes back muscles and improves flexibility" },
    ],
  },
  neck_pain: {
    label: "Neck Pain",
    drivers: [
      { factor: "Cold & wind", direction: "worsens", detail: "Cold wind causes cervical muscle tension and spasm" },
      { factor: "Pressure drop", direction: "worsens", detail: "Pressure changes affect cervical joint fluid similarly to other joints" },
      { factor: "Warmth", direction: "improves", detail: "Heat relaxes cervical muscles" },
    ],
  },
  muscle_stiffness: {
    label: "Muscle Stiffness",
    drivers: [
      { factor: "Cold temperatures", direction: "worsens", detail: "Cold reduces muscle elasticity and slows circulation" },
      { factor: "High humidity", direction: "worsens", detail: "Humid conditions slow warm-up and increase perceived stiffness" },
      { factor: "Warm, dry", direction: "improves", detail: "Warmth improves blood flow and reduces stiffness" },
    ],
  },
  breathing: {
    label: "Breathing Issues",
    drivers: [
      { factor: "High humidity", direction: "worsens", detail: "Humid air is heavier and harder to breathe, especially for respiratory conditions" },
      { factor: "High pollen", direction: "worsens", detail: "Pollen triggers airway inflammation and narrows passages" },
      { factor: "Cold air", direction: "worsens", detail: "Cold air constricts airways and can trigger bronchospasm" },
      { factor: "Air quality", direction: "worsens", detail: "Poor air quality days (ozone, particulates) severely worsen breathing" },
      { factor: "Mild, dry air", direction: "improves", detail: "Low humidity with mild temps is easiest on the respiratory system" },
    ],
  },
  asthma_flare: {
    label: "Asthma Flare",
    drivers: [
      { factor: "Cold air", direction: "worsens", detail: "Cold dry air is the most common asthma trigger — causes airway constriction" },
      { factor: "High pollen", direction: "worsens", detail: "Pollen is a primary allergen triggering asthma attacks" },
      { factor: "High humidity", direction: "worsens", detail: "Humid air supports mold and dust mite growth, common asthma triggers" },
      { factor: "Thunderstorms", direction: "worsens", detail: "Storm asthma: pollen bursts during thunderstorms spike ER visits" },
      { factor: "Warm mild humidity", direction: "improves", detail: "Moderate warmth with moderate humidity is generally favorable" },
    ],
  },
  sinus: {
    label: "Sinus Pressure",
    drivers: [
      { factor: "Pressure drop", direction: "worsens", detail: "Falling pressure creates a pressure differential in sinus cavities" },
      { factor: "High pollen", direction: "worsens", detail: "Pollen causes sinus membrane swelling and congestion" },
      { factor: "Dry air", direction: "worsens", detail: "Dry air irritates and dries out sinus membranes" },
      { factor: "Cold air", direction: "worsens", detail: "Cold causes sinus membrane swelling and slows mucus drainage" },
      { factor: "Stable pressure, moderate humidity", direction: "improves", detail: "Balanced conditions keep sinus pressure equalized" },
    ],
  },
  sneezing: {
    label: "Sneezing / Runny Nose",
    drivers: [
      { factor: "High pollen", direction: "worsens", detail: "Tree, grass, and ragweed pollen directly trigger sneezing fits" },
      { factor: "Wind", direction: "worsens", detail: "Wind disperses airborne pollen and irritants widely" },
      { factor: "Cold air", direction: "worsens", detail: "Cold air irritates nasal passages" },
      { factor: "Rain / low pollen", direction: "improves", detail: "Rain washes pollen from the air, providing relief" },
    ],
  },
  itchy_eyes: {
    label: "Itchy Eyes",
    drivers: [
      { factor: "High pollen", direction: "worsens", detail: "Pollen is the primary cause of allergic conjunctivitis" },
      { factor: "Wind", direction: "worsens", detail: "Wind-borne pollen and particulates directly contact eyes" },
      { factor: "Low UV / cloudy", direction: "improves", detail: "Overcast skies reduce both light sensitivity and UV-driven pollen release" },
    ],
  },
  fatigue: {
    label: "Fatigue",
    drivers: [
      { factor: "Low pressure", direction: "worsens", detail: "Low barometric pressure is associated with reduced oxygen availability and fatigue" },
      { factor: "High humidity", direction: "worsens", detail: "Humid air makes the body work harder to regulate temperature" },
      { factor: "Extreme heat", direction: "worsens", detail: "Heat stress depletes energy quickly" },
      { factor: "Overcast skies", direction: "worsens", detail: "Lack of sunlight reduces serotonin and increases lethargy" },
      { factor: "Mild, sunny", direction: "improves", detail: "Moderate temperatures and sunlight boost energy and mood" },
    ],
  },
  low_energy: {
    label: "Low Energy",
    drivers: [
      { factor: "Low pressure", direction: "worsens", detail: "Barometric lows correlate with reduced alertness and energy" },
      { factor: "Cold, overcast", direction: "worsens", detail: "Grey cold days suppress motivation and physical energy" },
      { factor: "Sunny, mild", direction: "improves", detail: "Bright days elevate cortisol and support energy levels" },
    ],
  },
  mood: {
    label: "Low Mood",
    drivers: [
      { factor: "Overcast / low light", direction: "worsens", detail: "Reduced sunlight lowers serotonin production — SAD-like effect" },
      { factor: "Cold temperatures", direction: "worsens", detail: "Cold, dark days worsen depressive symptoms" },
      { factor: "Storms / pressure drops", direction: "worsens", detail: "Rapid weather changes are linked to mood instability" },
      { factor: "Sunny, warm", direction: "improves", detail: "Sunlight boosts serotonin and vitamin D, elevating mood" },
    ],
  },
  anxiety: {
    label: "Anxiety",
    drivers: [
      { factor: "Heat", direction: "worsens", detail: "High temperatures increase heart rate and mimic anxiety physiologically" },
      { factor: "Storms", direction: "worsens", detail: "Rapid pressure changes and storm systems can trigger anxiety in sensitive individuals" },
      { factor: "Cool, stable, sunny", direction: "improves", detail: "Mild stable conditions support a calm nervous system" },
    ],
  },
  skin: {
    label: "Dry / Itchy Skin",
    drivers: [
      { factor: "Low humidity", direction: "worsens", detail: "Dry air pulls moisture from the skin barrier" },
      { factor: "Cold air", direction: "worsens", detail: "Cold temperatures reduce skin oil production and accelerate moisture loss" },
      { factor: "Wind", direction: "worsens", detail: "Wind accelerates evaporation from the skin surface" },
      { factor: "High humidity", direction: "improves", detail: "Moisture in the air helps maintain skin hydration" },
    ],
  },
  eczema_flare: {
    label: "Eczema / Psoriasis Flare",
    drivers: [
      { factor: "Low humidity", direction: "worsens", detail: "Dry air is the leading environmental trigger for eczema flares" },
      { factor: "Cold temperatures", direction: "worsens", detail: "Cold damages the skin barrier and triggers immune response" },
      { factor: "Heat & sweating", direction: "worsens", detail: "Excessive sweat irritates sensitive skin and worsens psoriasis" },
      { factor: "Moderate humidity", direction: "improves", detail: "Moderate humidity (40–60%) is ideal for compromised skin barriers" },
    ],
  },
  brain_fog: {
    label: "Brain Fog",
    drivers: [
      { factor: "Low pressure", direction: "worsens", detail: "Low barometric pressure is associated with reduced cognitive clarity" },
      { factor: "High humidity", direction: "worsens", detail: "Humid heat impairs concentration and cognitive performance" },
      { factor: "Cool, stable, dry", direction: "improves", detail: "Stable cool conditions support clearer thinking" },
    ],
  },
  dizziness: {
    label: "Dizziness",
    drivers: [
      { factor: "Pressure drop", direction: "worsens", detail: "Pressure changes affect inner ear fluid balance and can cause vertigo" },
      { factor: "Heat", direction: "worsens", detail: "Heat causes vasodilation and can trigger orthostatic dizziness" },
      { factor: "Stable, cool", direction: "improves", detail: "Stable pressure and cool temperatures support inner ear equilibrium" },
    ],
  },
  nausea: {
    label: "Nausea",
    drivers: [
      { factor: "Pressure drop", direction: "worsens", detail: "Rapid pressure changes upset the inner ear and can cause nausea" },
      { factor: "Extreme heat", direction: "worsens", detail: "Heat stress causes nausea through dehydration and vasodilation" },
      { factor: "Stable, mild", direction: "improves", detail: "Stable, mild conditions minimize inner ear and heat-related nausea" },
    ],
  },
  swelling: {
    label: "Swelling / Inflammation",
    drivers: [
      { factor: "Heat & humidity", direction: "worsens", detail: "Heat causes vasodilation and fluid retention, worsening swelling" },
      { factor: "Pressure drop", direction: "worsens", detail: "Lower pressure allows inflammatory fluid to expand in soft tissue" },
      { factor: "Cool, dry", direction: "improves", detail: "Cool conditions constrict blood vessels and reduce inflammatory swelling" },
    ],
  },
};

/** Return the weather drivers most relevant to a list of logged symptom IDs */
export function getDriversForSymptoms(symptomIds: string[]): WeatherDriver[] {
  const seen = new Set<string>();
  const drivers: WeatherDriver[] = [];
  for (const id of symptomIds) {
    const profile = SYMPTOM_WEATHER_MAP[id];
    if (!profile) continue;
    for (const d of profile.drivers) {
      const key = `${d.factor}|${d.direction}`;
      if (!seen.has(key)) {
        seen.add(key);
        drivers.push(d);
      }
    }
  }
  return drivers;
}

/** Get the weather factors most relevant to a TWC body index result */
export function getForecastDrivers(params: {
  achePainCategory: string | null;
  breathingCategory: string | null;
  pollenCategory: string | null;
}): string[] {
  const factors: string[] = [];
  const { achePainCategory, breathingCategory, pollenCategory } = params;
  const isNotLow = (c: string | null) => c && !["minimal", "low", "very good", "good"].includes(c.toLowerCase());

  if (isNotLow(achePainCategory)) factors.push(`Joint/body aches: ${achePainCategory} (barometric pressure, cold)`);
  if (isNotLow(breathingCategory)) factors.push(`Breathing: ${breathingCategory} (humidity, cold air)`);
  if (isNotLow(pollenCategory)) factors.push(`Pollen: ${pollenCategory} (tree, grass, or ragweed)`);
  if (factors.length === 0) factors.push("Conditions favorable across all body systems");
  return factors;
}
