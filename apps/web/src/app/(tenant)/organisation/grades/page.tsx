import { getTranslations } from 'next-intl/server';
import { GradesPageClient } from './grades-page-client';

export default async function OrganisationGradesPage() {
  const t = await getTranslations();
  return (
    <GradesPageClient
      title={t('organisation.grades.title')}
      description={t('organisation.grades.description')}
    />
  );
}
