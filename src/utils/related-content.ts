/**
 * Logical cross-links between content families — every link is derived from
 * data that actually exists (symptoms.json, procedures.json), never invented.
 */
import symptomsData from '../data/symptoms.json';
import proceduresData from '../data/procedures.json';
import type { ErrorCode } from './types';

const symptoms = (symptomsData as { symptoms: { slug: string; appliance: string; name?: string; title?: string }[] }).symptoms;
const procedures = (proceduresData as { procedures: { brand: string; appliance: string }[] }).procedures;

const symptomSet = new Set(symptoms.map((s) => `${s.appliance}/${s.slug}`));
const procedureSet = new Set(procedures.map((p) => `${p.brand}/${p.appliance}`));

/** Curated category → symptom mapping, only where the causal link is real. */
const CATEGORY_SYMPTOM: Record<string, Record<string, string>> = {
  washer: {
    drainage: 'washer-wont-drain', pump: 'washer-wont-drain',
    water_supply: 'washer-not-filling', water_inlet: 'washer-not-filling', water_level: 'washer-not-filling',
    leak: 'washer-leaking-water',
    balance: 'washer-shaking-loud', unbalanced: 'washer-shaking-loud',
    motor: 'washer-not-spinning',
    door: 'washer-wont-start', door_lock: 'washer-wont-start', door_latch: 'washer-wont-start',
    power: 'washer-wont-start',
  },
  dryer: {
    heating: 'dryer-not-heating', overheating: 'dryer-not-heating',
    airflow: 'dryer-not-drying', moisture_sensor: 'dryer-not-drying',
    power: 'dryer-wont-start', door: 'dryer-wont-start', door_latch: 'dryer-wont-start',
  },
  dishwasher: {
    drainage: 'dishwasher-not-draining', pump: 'dishwasher-not-draining',
    leak: 'dishwasher-leaking',
    filtration: 'dishwasher-not-cleaning', detergent: 'dishwasher-not-cleaning',
    power: 'dishwasher-wont-start', door: 'dishwasher-wont-start', door_latch: 'dishwasher-wont-start',
  },
  refrigerator: {
    cooling: 'refrigerator-not-cooling', compressor: 'refrigerator-not-cooling',
    defrost: 'refrigerator-not-cooling', temperature: 'refrigerator-not-cooling',
    temperature_sensor: 'refrigerator-not-cooling', fan: 'refrigerator-not-cooling',
    ice_maker: 'refrigerator-ice-maker-not-working',
  },
  oven: {
    heating: 'oven-not-heating', temperature_sensor: 'oven-not-heating',
    power: 'oven-wont-turn-on',
    door: 'oven-door-locked', door_lock: 'oven-door-locked', door_latch: 'oven-door-locked',
  },
};

const SYMPTOM_LABEL: Record<string, string> = {
  'washer-wont-drain': "Washer won't drain", 'washer-wont-start': "Washer won't start",
  'washer-not-filling': 'Washer not filling', 'washer-leaking-water': 'Washer leaking water',
  'washer-shaking-loud': 'Washer shaking or loud', 'washer-not-spinning': 'Washer not spinning',
  'dryer-not-heating': 'Dryer not heating', 'dryer-not-drying': 'Dryer not drying',
  'dryer-wont-start': "Dryer won't start", 'dishwasher-not-draining': 'Dishwasher not draining',
  'dishwasher-not-cleaning': 'Dishwasher not cleaning well', 'dishwasher-leaking': 'Dishwasher leaking',
  'dishwasher-wont-start': "Dishwasher won't start", 'refrigerator-not-cooling': 'Refrigerator not cooling',
  'refrigerator-ice-maker-not-working': 'Ice maker not working', 'refrigerator-freezing-food': 'Refrigerator freezing food',
  'oven-not-heating': 'Oven not heating', 'oven-wont-turn-on': "Oven won't turn on",
  'oven-door-locked': 'Oven door locked',
};

/** The symptom guide this error code manifests as, if one exists. */
export function symptomForCode(code: ErrorCode): { url: string; label: string } | null {
  const slug = CATEGORY_SYMPTOM[code.appliance]?.[code.category];
  if (!slug || !symptomSet.has(`${code.appliance}/${slug}`)) return null;
  return { url: `/symptoms/${code.appliance}/${slug}/`, label: SYMPTOM_LABEL[slug] ?? slug };
}

/** Whether full reset/diagnostic-mode guides exist for this brand+appliance. */
export function hasProcedure(brand: string, appliance: string): boolean {
  return procedureSet.has(`${brand}/${appliance}`);
}
