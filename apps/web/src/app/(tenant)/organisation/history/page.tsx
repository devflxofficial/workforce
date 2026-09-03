import { getTranslations } from 'next-intl/server';
import { HistoryPageClient } from './history-page-client';

export default async function OrganisationHistoryPage() {
  const t = await getTranslations();
  return (
    <HistoryPageClient
      title={t('organisation.history.title')}
      description={t('organisation.history.description')}
    />
  );
}
