// Политика обработки персональных данных: текст предоставит заказчик, пока — видимая заглушка [уточнить].
import './pages.css';
import { Container } from '../ui/layout.jsx';
import { useVariant } from '../variants/VariantContext.jsx';
import { usePageTitle } from './parts/usePageTitle.js';

export default function PrivacyPage() {
  const { id, ui } = useVariant();
  usePageTitle('Политика обработки персональных данных');
  return (
    <main className="page page-privacy">
      <Container className="py-8 md:py-12">
        <ui.PageHeader
          title="Политика обработки персональных данных"
          breadcrumbs={[{ label: 'Главная', to: `/${id}` }, { label: 'Политика обработки данных' }]}
        />
        <div className="mt-8 flex max-w-[68ch] flex-col gap-4 text-base text-pretty text-fg">
          <p>[уточнить] Текст политики обработки персональных данных (152-ФЗ) предоставит заказчик: на странице-источнике dvk-style.ru он закрыт от сбора.</p>
          <div>
            <ui.Button variant="secondary" to={`/${id}/request`}>
              Вернуться к заявке
            </ui.Button>
          </div>
        </div>
      </Container>
    </main>
  );
}
