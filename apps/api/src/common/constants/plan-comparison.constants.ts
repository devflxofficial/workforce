/** SCR-SUB-02 comparison row keys — labels resolved client-side via i18n. */
export const PLAN_COMPARISON_FEATURE_KEYS = [
  'employee_limit',
  'core_hr',
  'attendance',
  'leave',
  'payroll',
  'workflows',
  'reports',
  'sso',
  'api',
  'support',
  'hosting',
] as const;

export type PlanComparisonFeatureKey = (typeof PLAN_COMPARISON_FEATURE_KEYS)[number];

/** Maps entitlement codes to comparison feature keys where applicable. */
export const ENTITLEMENT_TO_COMPARISON_KEY: Record<string, PlanComparisonFeatureKey> = {
  'module.core_hr': 'core_hr',
  'module.attendance': 'attendance',
  'module.leave': 'leave',
  'module.payroll': 'payroll',
  'module.workflows': 'workflows',
  'module.reports': 'reports',
  'feature.sso': 'sso',
  'feature.api': 'api',
  'feature.support': 'support',
  'feature.hosting': 'hosting',
  'limit.employees': 'employee_limit',
};
