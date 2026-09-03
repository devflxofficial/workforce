export interface TenantIntegrationDetail {
  id: string;
  connectionType: string;
  name: string;
  adapterCode: string;
  configuration: Record<string, unknown>;
  status: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantIntegrationPayload {
  connectionType: string;
  name: string;
  adapterCode: string;
  configuration?: Record<string, unknown>;
}

export interface UpdateTenantIntegrationPayload {
  name?: string;
  configuration?: Record<string, unknown>;
}

export interface IntegrationHealthSummary {
  activeConnections: number;
  failedConnections: number;
  unmappedEvents: number;
  recentSyncRuns: Array<{
    id: string;
    integrationName: string;
    status: string;
    itemsProcessed: number;
    errorCount: number;
    startedAt: string;
    finishedAt: string | null;
    message: string | null;
  }>;
}

export interface ExternalMapping {
  id: string;
  integrationId: string;
  mappingType: string;
  externalId: string;
  internalId: string | null;
  status: string;
  lastEventAt: string | null;
}

export interface ApiClientItem {
  id: string;
  name: string;
  tenantId: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface CreateApiClientPayload {
  name: string;
  scopes: string[];
  expiresAt?: string;
}

export interface CreateApiClientResult {
  id: string;
  name: string;
  tenantId: string;
  scopes: string[];
  clientSecret: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface RotateSecretResult {
  clientSecret: string;
  rotatedAt: string;
}
