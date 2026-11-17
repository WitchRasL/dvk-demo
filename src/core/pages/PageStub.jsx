// Общая заглушка страницы каркаса. Таск страниц заменяет страницы и этот файл.
import { useVariant } from '../variants/VariantContext.jsx';

/** ({ name, title, lead, direction, children }) → <main className="page page-<name>"> */
export default function PageStub({ name, title, lead, direction, breadcrumbs, children }) {
  const { ui } = useVariant();
  return (
    <main className={`page page-${name}`} data-direction={direction}>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <ui.PageHeader title={title} lead={lead} breadcrumbs={breadcrumbs} />
        {children ? <div className="mt-8">{children}</div> : null}
        <p className="mt-8 text-sm text-fg-muted">Страница-заглушка каркаса: содержимое появится на следующем этапе сборки.</p>
      </div>
    </main>
  );
}
