// Страница не найдена: и для неизвестного адреса, и для товара, проекта, отрасли с несуществующим адресом.
import './pages.css';
import { Link } from 'react-router';
import { buildCatalogUrl, getDirections } from '../catalog/index.js';
import { Container } from '../ui/layout.jsx';
import { useVariant } from '../variants/VariantContext.jsx';
import { RequestCta } from './parts/RequestCta.jsx';
import { usePageTitle } from './parts/usePageTitle.js';

const LEADS = {
  товар: 'Товара с таким адресом в каталоге нет: возможно, ссылка устарела.',
  проект: 'Проекта с таким адресом нет: возможно, ссылка устарела.',
  отрасль: 'Решения для такой отрасли нет: возможно, ссылка устарела.',
};

/** @param {{ what?: 'товар'|'проект'|'отрасль' }} props — что искали, если адрес вёл на конкретную сущность */
export default function NotFoundPage({ what }) {
  const { id, ui } = useVariant();
  usePageTitle('Страница не найдена');
  return (
    <main className="page page-not-found">
      <Container className="py-12 md:py-20">
        <ui.PageHeader
          title="Страница не найдена"
          lead={LEADS[what] ?? 'Такого адреса в прототипе нет. Вернитесь на главную или выберите направление каталога.'}
          breadcrumbs={[{ label: 'Главная', to: `/${id}` }, { label: 'Страница не найдена' }]}
        >
          <div className="flex flex-wrap gap-3">
            <ui.Button to={`/${id}`}>На главную</ui.Button>
            <ui.Button variant="secondary" to={buildCatalogUrl(id, {})}>
              В каталог
            </ui.Button>
          </div>
        </ui.PageHeader>
        <nav aria-label="Направления каталога" className="mt-8">
          <ul className="flex flex-wrap gap-x-8 gap-y-2">
            {getDirections().map((direction) => (
              <li key={direction.id}>
                <Link to={buildCatalogUrl(id, { direction: direction.id })} className="inline-flex min-h-10 items-center text-base underline underline-offset-4 hover:no-underline">
                  {direction.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <RequestCta className="mt-0 md:mt-0" />
    </main>
  );
}
