import { IntegrationSetupPageClient } from '../../../../../modules/integrations/components/integration-setup-page-client';

interface IntegrationSetupPageProps {
  params: Promise<{ id: string }>;
}

export default async function IntegrationSetupPage({ params }: IntegrationSetupPageProps) {
  const { id } = await params;
  return <IntegrationSetupPageClient adapterId={id} />;
}
