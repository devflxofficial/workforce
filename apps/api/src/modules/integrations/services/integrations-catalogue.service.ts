import { Injectable } from '@nestjs/common';

export const INTEGRATION_CATALOGUE = [
  { id: 'biometric', category: 'biometric', configureHref: '/integrations/biometric' },
  { id: 'sso', category: 'sso', configureHref: '/settings/security' },
  { id: 'payroll_export', category: 'payroll_export', configureHref: '/payroll' },
  { id: 'finance', category: 'finance', configureHref: '/integrations/credentials' },
  { id: 'email', category: 'email', configureHref: '/integrations/email/setup' },
  { id: 'sms', category: 'sms', configureHref: '/integrations/sms/setup' },
  { id: 'webhook', category: 'webhook', configureHref: '/integrations/webhook/setup' },
  { id: 'api', category: 'api', configureHref: '/integrations/credentials' },
] as const;

@Injectable()
export class IntegrationsCatalogueService {
  /**
   * Returns static catalogue with configured=false until TenantIntegration storage exists.
   * Never invents a "connected" status.
   */
  list(_tenantId: string) {
    return INTEGRATION_CATALOGUE.map((item) => ({
      id: item.id,
      category: item.category,
      configured: false,
      status: 'NOT_CONFIGURED' as const,
      configureHref: item.configureHref,
    }));
  }
}
