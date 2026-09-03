export interface IntegrationItem {
  id: string;
  category: string;
  configured: boolean;
  status: string;
  configureHref: string;
  tenantIntegrationId?: string | null;
  name?: string | null;
  lastSuccessAt?: string | null;
  lastFailureAt?: string | null;
}

export const INTEGRATION_CATEGORIES = [
  'biometric',
  'sso',
  'payroll_export',
  'finance',
  'email',
  'sms',
  'webhook',
  'api',
] as const;

export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];
