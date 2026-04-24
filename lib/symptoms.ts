export interface SymptomMeta {
  id: string;
  label: string;
  icon: string;
  group: string;
}

export const SYMPTOM_GROUPS: { group: string; items: SymptomMeta[] }[] = [
  {
    group: "Head & Neurological",
    items: [
      { id: "headache", label: "Headache", icon: "🤕", group: "Head & Neurological" },
      { id: "migraine", label: "Migraine", icon: "😵", group: "Head & Neurological" },
      { id: "dizziness", label: "Dizziness", icon: "💫", group: "Head & Neurological" },
      { id: "brain_fog", label: "Brain Fog", icon: "🌫️", group: "Head & Neurological" },
    ],
  },
  {
    group: "Joints & Muscles",
    items: [
      { id: "joint_ache", label: "Joint Aches", icon: "🦴", group: "Joints & Muscles" },
      { id: "ra_flare", label: "RA Flare", icon: "🦾", group: "Joints & Muscles" },
      { id: "back_pain", label: "Back Pain", icon: "🔙", group: "Joints & Muscles" },
      { id: "neck_pain", label: "Neck Pain", icon: "🫙", group: "Joints & Muscles" },
      { id: "muscle_stiffness", label: "Muscle Stiffness", icon: "💪", group: "Joints & Muscles" },
      { id: "fibro_flare", label: "Fibro Flare", icon: "⚡", group: "Joints & Muscles" },
    ],
  },
  {
    group: "Respiratory & Allergy",
    items: [
      { id: "breathing", label: "Breathing Issues", icon: "🫁", group: "Respiratory & Allergy" },
      { id: "asthma_flare", label: "Asthma Flare", icon: "💨", group: "Respiratory & Allergy" },
      { id: "sinus", label: "Sinus Pressure", icon: "😤", group: "Respiratory & Allergy" },
      { id: "sneezing", label: "Sneezing / Runny Nose", icon: "🤧", group: "Respiratory & Allergy" },
      { id: "itchy_eyes", label: "Itchy Eyes", icon: "👁️", group: "Respiratory & Allergy" },
    ],
  },
  {
    group: "Energy & Mood",
    items: [
      { id: "fatigue", label: "Fatigue", icon: "😴", group: "Energy & Mood" },
      { id: "low_energy", label: "Low Energy", icon: "🪫", group: "Energy & Mood" },
      { id: "mood", label: "Low Mood", icon: "😔", group: "Energy & Mood" },
      { id: "anxiety", label: "Anxiety", icon: "😰", group: "Energy & Mood" },
    ],
  },
  {
    group: "Skin & Other",
    items: [
      { id: "skin", label: "Dry / Itchy Skin", icon: "🧴", group: "Skin & Other" },
      { id: "eczema_flare", label: "Eczema / Psoriasis Flare", icon: "🌡️", group: "Skin & Other" },
      { id: "nausea", label: "Nausea", icon: "🤢", group: "Skin & Other" },
      { id: "swelling", label: "Swelling / Inflammation", icon: "🫧", group: "Skin & Other" },
    ],
  },
];

export const ALL_SYMPTOMS = SYMPTOM_GROUPS.flatMap((g) => g.items);
export const SYMPTOM_BY_ID: Record<string, SymptomMeta> = Object.fromEntries(
  ALL_SYMPTOMS.map((s) => [s.id, s])
);
