import { useVariant } from '../variants/VariantContext.jsx';
import PageStub from './PageStub.jsx';

export default function NotFoundPage() {
  const { id, ui } = useVariant();
  return (
    <PageStub name="not-found" title="Страница не найдена" lead="Такого адреса в прототипе нет.">
      <div className="flex flex-wrap gap-3">
        <ui.Button to={`/${id}`}>На главную</ui.Button>
        <ui.Button variant="secondary" to={`/${id}/catalog`}>
          В каталог
        </ui.Button>
      </div>
    </PageStub>
  );
}
