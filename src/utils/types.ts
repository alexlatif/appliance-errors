export interface Brand {
  slug: string;
  name: string;
  parent?: string;
  logo_color: string;
  appliances: string[];
  description: string;
}

export interface ApplianceType {
  slug: string;
  name: string;
  plural: string;
  icon: string;
}

export interface Cause {
  description: string;
  frequency: number; // 0-100 percent
}

export interface FixStep {
  title: string;
  description: string;
  parts?: string[];
  warning?: string;
}

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Difficulty = 'easy' | 'moderate' | 'hard' | 'pro_only';

export interface ErrorCode {
  id: string;
  brand: string;
  appliance: string;
  code: string;
  aliases: string[];
  meaning: string;
  detail: string;
  severity: Severity;
  category: string;
  causes: Cause[];
  fixes: FixStep[];
  diy_difficulty: Difficulty;
  cost_lo: number;
  cost_hi: number;
  pro_cost_lo: number;
  pro_cost_hi: number;
  reset_instructions: string;
  related_codes: string[];
  models_affected?: string;
  when_to_call_pro: string;
}

export interface SiteData {
  brands: Brand[];
  appliance_types: ApplianceType[];
  error_codes: ErrorCode[];
}
