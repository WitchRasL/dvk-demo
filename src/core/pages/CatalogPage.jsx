import { useParams, useSearchParams } from 'react-router';
import { useVariant } from '../variants/VariantContext.jsx';
import PageStub from './PageStub.jsx';

const DIRECTIONS = ['retail', 'landscape', 'metal'];

export default function CatalogPage() {
  const { id } = useVariant();
  const { direction, section, category } = useParams();
  const [searchParams] = useSearchParams();
  const known = DIRECTIONS.includes(direction) ? direction : undefined;
  const filters = [...searchParams].map(([key, value]) => `${key} = ${value}`);
  const path = [direction, section, category].filter(Boolean).join(' / ');
  return (
    <PageStub
      name="catalog"
      title="Каталог"
      lead={path ? `Раздел: ${path}` : 'Все направления'}
      direction={known}
      breadcrumbs={[
        { label: 'Главная', to: `/${id}` },
        { label: 'Каталог', to: `/${id}/catalog` },
      ]}
    >
      <p className="font-mono text-sm text-fg-muted">Параметры: {filters.length ? filters.join(' · ') : 'нет'}</p>
    </PageStub>
  );
}
