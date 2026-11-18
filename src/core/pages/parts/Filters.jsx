// Боковая панель каталога: поиск, дерево «направление → раздел», фасеты (отрасль, категория, материал, подсветка).
// Состояние живёт в URL (useCatalogQuery); здесь только разметка и вызовы setFilter/reset.
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '../../../lib/utils.js';
import { buildCatalogUrl, getDirections } from '../../catalog/index.js';
import { useVariant } from '../../variants/VariantContext.jsx';

const FACET_GROUPS = [
  { key: 'industry', title: 'Отрасль', any: 'Любая' },
  { key: 'category', title: 'Категория', any: 'Любая' },
  { key: 'material', title: 'Материал', any: 'Любой' },
  { key: 'light', title: 'Подсветка', any: 'Любая' },
];

const SEARCH_DELAY_MS = 250;
const normalizeQuery = (text) => text.replace(/\s+/g, ' ').trim();

/** Число выбранных фильтров строки запроса (путь — направление, раздел, категория — не считается). */
export function countActiveFilters(query) {
  return ['industry', 'material', 'light'].filter((key) => query[key]).length + (query.q ? 1 : 0);
}

/** Поле поиска: набор отправляется с задержкой, Enter — сразу; внешний сброс (URL) подхватывается. */
export function CatalogSearch({ value, onSearch, className }) {
  const [text, setText] = useState(value);
  const sent = useRef(value);
  const timer = useRef(null);
  const inputId = useId();

  useEffect(() => {
    if (value !== sent.current) {
      sent.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function send(next) {
    clearTimeout(timer.current);
    const normalized = normalizeQuery(next);
    if (normalized === sent.current) return;
    sent.current = normalized;
    onSearch(normalized);
  }

  return (
    <form
      role="search"
      className={cn('relative', className)}
      onSubmit={(event) => {
        event.preventDefault();
        send(text);
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Поиск по каталогу
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
      <input
        id={inputId}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder="Название или материал"
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => send(next), SEARCH_DELAY_MS);
        }}
        className="block min-h-11 w-full rounded-base border border-line bg-surface py-2.5 pr-11 pl-10 text-base text-fg"
      />
      {text ? (
        <button
          type="button"
          aria-label="Очистить поиск"
          onClick={() => {
            setText('');
            send('');
          }}
          className="absolute top-1/2 right-1 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-base text-fg-muted transition-[opacity] duration-fast ease-out hover:text-fg"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </form>
  );
}

function treeLinkClass(active) {
  return cn(
    'flex items-baseline justify-between gap-3 rounded-base px-2.5 py-2 text-sm transition-[opacity] duration-fast ease-out hover:bg-surface-2',
    active ? 'bg-surface-2 font-medium text-fg' : 'text-fg-muted hover:text-fg',
  );
}

/** Дерево каталога для широких экранов: направления равны, у выбранного раскрыты разделы с числом позиций на dvk-style.ru. */
function CatalogTree({ query, className }) {
  const { id: variantId } = useVariant();
  const directions = getDirections();
  return (
    <nav aria-label="Разделы каталога" className={className}>
      <ul className="flex flex-col gap-0.5">
        <li>
          <Link to={buildCatalogUrl(variantId, {})} aria-current={!query.direction ? 'page' : undefined} className={treeLinkClass(!query.direction)}>
            Все направления
          </Link>
        </li>
        {directions.map((direction) => {
          const open = query.direction === direction.id;
          return (
            <li key={direction.id}>
              <Link
                to={buildCatalogUrl(variantId, { direction: direction.id })}
                aria-current={open && !query.section ? 'page' : undefined}
                className={treeLinkClass(open && !query.section)}
              >
                {direction.name}
              </Link>
              {open ? (
                <ul className="mt-0.5 mb-1.5 ml-3 flex flex-col gap-0.5 border-l border-line pl-2">
                  {direction.sections.map((section) => {
                    const active = query.section === section.id;
                    return (
                      <li key={section.id}>
                        <Link
                          to={buildCatalogUrl(variantId, { direction: direction.id, section: section.id })}
                          aria-current={active && !query.category ? 'page' : undefined}
                          className={treeLinkClass(active)}
                        >
                          <span>{section.name}</span>
                          <span className="tabular text-xs text-fg-muted" title="Позиций на dvk-style.ru">
                            {section.count}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Те же разделы на телефоне: горизонтальный ряд ссылок со scroll-snap (разделы выбранного направления). */
function CatalogChips({ query, className }) {
  const { id: variantId } = useVariant();
  const direction = getDirections().find((item) => item.id === query.direction);
  if (!direction) return null; // на «Все направления» выбор направления — блок над списком
  const chips = direction.sections.map((section) => ({
    id: section.id,
    label: section.name,
    active: query.section === section.id,
    to: buildCatalogUrl(variantId, { direction: direction.id, section: section.id }),
  }));
  return (
    <nav aria-label={`Разделы: ${direction.name}`} className={className}>
      <ul className="rail relative -mx-4 flex snap-x gap-2 overflow-x-auto scroll-pl-4 px-4 pb-2">
        <li className="shrink-0 snap-start">
          <Link to={buildCatalogUrl(variantId, {})} className="inline-flex min-h-10 items-center rounded-base border border-line px-3.5 text-sm text-fg-muted hover:text-fg">
            Все направления
          </Link>
        </li>
        {chips.map((chip) => (
          <li key={chip.id} className="shrink-0 snap-start">
            <Link
              to={chip.to}
              aria-current={chip.active ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-10 items-center rounded-base border px-3.5 text-sm transition-[opacity] duration-fast ease-out',
                chip.active ? 'border-fg bg-surface-2 font-medium text-fg' : 'border-line text-fg hover:bg-surface-2',
              )}
            >
              {chip.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FacetGroup({ group, items, selected, onChange }) {
  if (!items.length) return null;
  return (
    <details className="group/facet border-t border-line py-3 first:border-t-0" open={items.length <= 8 || Boolean(selected) || undefined}>
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-fg [&::-webkit-details-marker]:hidden">
        {group.title}
        <ChevronDown className="size-4 text-fg-muted transition-transform duration-fast ease-out group-open/facet:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
      </summary>
      <fieldset className="rail mt-1 max-h-64 overflow-y-auto pr-1">
        <legend className="sr-only">{group.title}</legend>
        <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm text-fg">
          <input type="radio" name={`facet-${group.key}`} checked={!selected} onChange={() => onChange(group.key, null)} />
          <span>{group.any}</span>
        </label>
        {items.map((item) => (
          <label key={item.value} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm text-fg">
            <input type="radio" name={`facet-${group.key}`} checked={selected === item.value} onChange={() => onChange(group.key, item.value)} />
            <span className="min-w-0 flex-1 text-pretty">{item.label}</span>
            <span className="tabular text-fg-muted">{item.count}</span>
          </label>
        ))}
      </fieldset>
    </details>
  );
}

/**
 * Панель фильтров каталога.
 * @param {{ query: object, result: { facets: object }, setFilter: (key: string, value: any) => void, reset: () => void, className?: string }} props
 */
export function Filters({ query, result, setFilter, reset, className }) {
  const [open, setOpen] = useState(false); // на телефоне фасеты свёрнуты
  const panelId = useId();
  const active = countActiveFilters(query);
  const { ui } = useVariant();

  return (
    <aside
      aria-label="Поиск и фильтры"
      className={cn(
        'catalog-filters flex min-w-0 flex-col gap-4 lg:sticky lg:top-[var(--page-sticky-top,1.5rem)] lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto lg:pr-1',
        className,
      )}
    >
      <CatalogSearch value={query.q} onSearch={(value) => setFilter('q', value)} />
      <CatalogChips query={query} className="lg:hidden" />
      <CatalogTree query={query} className="hidden lg:block" />

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 items-center justify-between gap-2 rounded-base border border-line px-3.5 text-sm font-medium text-fg transition-[opacity] duration-fast ease-out hover:bg-surface-2 lg:hidden"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Фильтры{active ? ` · ${active}` : ''}
        </span>
        <ChevronDown className={cn('size-4 transition-transform duration-fast ease-out motion-reduce:transition-none', open && 'rotate-180')} aria-hidden="true" />
      </button>

      <div id={panelId} className={cn(open ? 'block' : 'hidden', 'lg:block')}>
        <div className="rounded-base border border-line px-3.5 lg:border-0 lg:px-0">
          {FACET_GROUPS.map((group) => (
            <FacetGroup key={group.key} group={group} items={result.facets[group.key] ?? []} selected={query[group.key]} onChange={setFilter} />
          ))}
        </div>
        {active ? (
          <ui.Button variant="ghost" size="sm" className="mt-2" onClick={() => reset()}>
            Сбросить фильтры
          </ui.Button>
        ) : null}
      </div>
    </aside>
  );
}
