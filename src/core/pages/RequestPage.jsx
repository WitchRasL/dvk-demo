// Запрос КП: список подборки и квиз подбора на одной странице. Квиз — форма заявки, подборка уходит вместе с ней.
import './pages.css';
import { KpList } from '../request/KpList.jsx';
import { Quiz } from '../request/Quiz.jsx';
import { Container } from '../ui/layout.jsx';
import { useVariant } from '../variants/VariantContext.jsx';
import { usePageTitle } from './parts/usePageTitle.js';

export default function RequestPage() {
  const { id, ui } = useVariant();
  usePageTitle('Запрос КП');
  return (
    <main className="page page-request">
      <Container className="pt-8 md:pt-12">
        <ui.PageHeader
          title="Запрос КП"
          lead="Соберите подборку товаров и оставьте заявку: подберём оборудование и подготовим коммерческое предложение."
          breadcrumbs={[{ label: 'Главная', to: `/${id}` }, { label: 'Запрос КП' }]}
        />
      </Container>
      <Container className="grid gap-12 py-8 md:py-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <ui.Reveal className="min-w-0">
          <KpList />
        </ui.Reveal>
        <div className="min-w-0">
          <Quiz />
        </div>
      </Container>
    </main>
  );
}
