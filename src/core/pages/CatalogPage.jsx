// Каталог: /catalog, /catalog/:direction/:section?/:category? + фильтры, поиск, сортировка и страница в URL.
import './pages.css';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ExternalLink, X } from 'lucide-react';
import {
  SORT_LABELS,
  buildCatalogUrl,
  getCategory,
  getDirection,
  getDirections,
  getIndustry,
  getSection,
  useCatalogQuery,
} from '../catalog/index.js';
import { wordFor } from '../ui/format.js';
import { fieldClass } from '../ui/form.jsx';
import { Container } from '../ui/layout.jsx';
import { useVariant } from '../variants/VariantContext.jsx';
import { cn } from '../../lib/utils.js';
import { EmptyState } from './parts/EmptyState.jsx';
import { Filters, countActiveFilters } from './parts/Filters.jsx';
import { Pagination } from './parts/Pagination.jsx';
import { useQuickView } from './parts/QuickView.jsx';
import { RequestCta } from './parts/RequestCta.jsx';
import { usePageTitle } from './parts/usePageTitle.js';

/** Три направления равного веса: название, суть и разделы с числом позиций на dvk-style.ru. */
function DirectionOverview({ variantId }) {
  const { ui } = useVariant();
  return (
    <Container className="py-8 md:py-10">
      <ui.Reveal>
        <ul className="grid gap-8 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-line">
          {getDirections().map((direction) => (
            <li key={direction.id} className="min-w-0 lg:px-7 lg:first:pl-0 lg:last:pr-0">
              <h2 className="font-display text-xl leading-snug text-balance break-words xl:text-2xl">
                <Link to={buildCatalogUrl(variantId, { direction: direction.id })} className="underline-offset-4 hover:underline">
                  {direction.name}
                </Link>
              </h2>
              {direction.summary ? <p className="mt-2 max-w-[44ch] text-sm text-pretty text-fg-muted">{direction.summary}</p> : null}
              <ul className="mt-4">
                {direction.sections.map((section) => (
                  <li key={section.id}>
                    <Link
                      to={buildCatalogUrl(variantId, { direction: direction.id, section: section.id })}
                      className="flex items-baseline justify-between gap-4 border-t border-line py-2.5 text-sm text-fg transition-[opacity] duration-fast ease-out hover:bg-surface-2"
                    >
                      <span>{section.name}</span>
                      <span className="tabular text-fg-muted" title="Позиций на dvk-style.ru">
                        {section.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </ui.Reveal>
    </Container>
  );
}

/** Выбранные фильтры строки запроса — чипами с крестиком. */
function ActiveFilters({ query, facets, setFilter }) {
  const label = (key, value) => facets[key]?.find((item) => item.value === value)?.label ?? value;
  const chips = [];
  if (query.q) chips.push({ key: 'q', text: `Поиск: «${query.q}»` });
  if (query.industry) chips.push({ key: 'industry', text: getIndustry(query.industry)?.name ?? query.industry });
  if (query.material) chips.push({ key: 'material', text: label('material', query.material) });
  if (query.light) chips.push({ key: 'light', text: label('light', query.light) });
  if (!chips.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Выбранные фильтры">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={() => setFilter(chip.key, null)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-base border border-line bg-surface-2 py-1 pr-2 pl-3 text-sm text-fg transition-[opacity] duration-fast ease-out hover:opacity-80"
          >
            {chip.text}
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">: убрать фильтр</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function CatalogPage() {
  const { id: variantId, ui } = useVariant();
  const { query, result, setFilter, reset } = useCatalogQuery();
  const { openQuickView, quickView } = useQuickView();
  const resultsRef = useRef(null);
  const lastPage = useRef(query.page);

  const direction = getDirection(query.direction);
  const section = query.section ? getSection(query.direction, query.section) : null;
  const category = query.category ? getCategory(query.category, query.section) : null;
  const scope = category ?? section; // самый узкий выбранный раздел дерева
  const active = countActiveFilters(query);

  const title = category?.name ?? section?.name ?? direction?.name ?? 'Каталог';
  usePageTitle(`${title} — каталог`);

  let lead = 'Выберите направление или найдите товар по названию, материалу и размеру.';
  if (scope) lead = `${direction?.name ?? ''}. На dvk-style.ru здесь ${scope.count} ${wordFor(scope.count, 'position')}; в прототипе — характерные товары.`;
  else if (direction) lead = direction.summary || lead;

  const breadcrumbs = [
    { label: 'Главная', to: `/${variantId}` },
    { label: 'Каталог', to: buildCatalogUrl(variantId, {}) },
  ];
  if (direction) breadcrumbs.push({ label: direction.name, to: buildCatalogUrl(variantId, { direction: direction.id }) });
  if (section) breadcrumbs.push({ label: section.name, to: buildCatalogUrl(variantId, { direction: direction?.id, section: section.id }) });
  if (category) breadcrumbs.push({ label: category.name }); // последняя крошка — текущая страница

  // Смена страницы нумерации — к началу списка (смена пути страницы обрабатывается оболочкой).
  useEffect(() => {
    if (lastPage.current !== result.page) {
      lastPage.current = result.page;
      resultsRef.current?.scrollIntoView({ block: 'start' });
    }
  }, [result.page]);

  // Ключ списка без поиска: набор текста не пересобирает появление.
  const listKey = [query.direction, query.section, query.category, query.industry, query.material, query.light, query.sort, result.page].join('|');
  const hrefFor = (page) => buildCatalogUrl(variantId, { ...query, page });
  const filtered = active > 0;

  return (
    <main className="page page-catalog" data-direction={query.direction ?? undefined}>
      <Container className="pt-8 md:pt-12">
        <ui.PageHeader title={title} lead={lead} breadcrumbs={breadcrumbs} />
      </Container>

      {!direction ? <DirectionOverview variantId={variantId} /> : null}

      <Container className="grid gap-6 py-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <Filters query={query} result={result} setFilter={setFilter} reset={reset} />

        <div ref={resultsRef} className="min-w-0 scroll-mt-4">
          <h2 className="sr-only">Товары</h2>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <p role="status" className="tabular text-base text-fg">
              Найдено: <strong className="font-semibold">{result.total}</strong> {wordFor(result.total, 'product')}
            </p>
            <label className="flex items-center gap-2.5 text-sm text-fg-muted">
              Сортировка
              <select
                value={query.sort}
                onChange={(event) => setFilter('sort', event.target.value)}
                className={cn(fieldClass, 'w-auto min-w-44 py-2 text-sm')}
              >
                {Object.entries(SORT_LABELS).map(([value, name]) => (
                  <option key={value} value={value}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ActiveFilters query={query} facets={result.facets} setFilter={setFilter} />

          {scope ? (
            <p className="mt-4 max-w-[68ch] text-sm text-pretty text-fg-muted">
              Показаны характерные товары. Весь раздел «{scope.name}» — {scope.count} {wordFor(scope.count, 'position')} —{' '}
              <a href={scope.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-fg underline underline-offset-4 hover:no-underline">
                на dvk-style.ru
                <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(откроется в новой вкладке)</span>
              </a>
              .
            </p>
          ) : null}

          <div className="mt-6">
            {result.total > 0 ? (
              <ui.Reveal key={listKey}>
                <ui.ProductList products={result.items} onQuickView={openQuickView} layout="grid" />
              </ui.Reveal>
            ) : filtered ? (
              <EmptyState
                title="Ничего не найдено"
                actions={
                  <>
                    <ui.Button onClick={() => reset()}>Сбросить фильтры</ui.Button>
                    <ui.Button variant="secondary" to={`/${variantId}/request`}>
                      Подберём сами — оставьте заявку
                    </ui.Button>
                  </>
                }
              >
                <p>
                  {query.q ? `По запросу «${query.q}» ` : 'По выбранным условиям '}
                  товаров нет. Уберите часть условий или поменяйте запрос — или оставьте заявку, и мы подберём оборудование сами.
                </p>
              </EmptyState>
            ) : (
              <EmptyState
                title="В прототипе здесь пока нет товаров"
                actions={
                  <>
                    <ui.Button to={buildCatalogUrl(variantId, {})}>Весь каталог</ui.Button>
                    <ui.Button variant="secondary" to={`/${variantId}/request`}>
                      Подберём сами — оставьте заявку
                    </ui.Button>
                  </>
                }
              >
                <p>
                  Для этого раздела товары ещё не перенесены.
                  {scope ? ` На dvk-style.ru в нём ${scope.count} ${wordFor(scope.count, 'position')}.` : ''}
                </p>
              </EmptyState>
            )}
          </div>

          <Pagination page={result.page} pages={result.pages} hrefFor={hrefFor} className="mt-8" />
        </div>
      </Container>

      <RequestCta />
      {quickView}
    </main>
  );
}
