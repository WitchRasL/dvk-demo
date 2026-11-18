// Решение для отрасли: /solutions/:industry. Шаблон для любой отрасли из categories.json:
// серии и типы оборудования показываются, только если они есть в данных (у аптек — есть).
import './pages.css';
import { Link, useParams } from 'react-router';
import { ExternalLink } from 'lucide-react';
import { buildCatalogUrl, getCategory, getIndustries, getIndustry, getProjects, queryProducts } from '../catalog/index.js';
import { imageSrc, srcSet } from '../../lib/images.js';
import { cn } from '../../lib/utils.js';
import { plural } from '../ui/format.js';
import { Container } from '../ui/layout.jsx';
import { useVariant } from '../variants/VariantContext.jsx';
import { useQuickView } from './parts/QuickView.jsx';
import { RequestCta } from './parts/RequestCta.jsx';
import { usePageTitle } from './parts/usePageTitle.js';
import NotFoundPage from './NotFoundPage.jsx';

const POSITION_FORMS = ['позиция', 'позиции', 'позиций'];
const SERIES_FORMS = ['серия', 'серии', 'серий'];
const PRODUCT_FORMS = ['товар', 'товара', 'товаров'];
const PREVIEW_COUNT = 8;

/** Переключатель отраслей: ссылки на все отрасли, текущая отмечена. Ряд со scroll-snap на телефоне. */
function IndustryNav({ current, variantId }) {
  return (
    <nav aria-label="Отрасли" className="border-b border-line">
      <ul className="rail relative -mx-4 flex snap-x gap-1 overflow-x-auto scroll-pl-4 px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {getIndustries().map((industry) => {
          const active = industry.id === current;
          return (
            <li key={industry.id} className="shrink-0 snap-start">
              <Link
                to={`/${variantId}/solutions/${industry.slug}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center border-b-2 px-3 text-sm transition-[opacity] duration-fast ease-out',
                  active ? 'border-fg font-medium text-fg' : 'border-transparent text-fg-muted hover:text-fg',
                )}
              >
                {industry.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Серии оборудования с сайта: фото, название, число позиций; ссылка ведёт на страницу серии на dvk-style.ru. */
function SeriesList({ series }) {
  return (
    <ul className="rail relative -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
      {series.map((item) => (
        <li key={item.slug} className="w-[72%] min-w-0 shrink-0 snap-start sm:w-auto">
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface transition-[opacity] duration-fast ease-out hover:bg-surface-2"
          >
            <span className="block aspect-square overflow-hidden bg-surface-2">
              {item.image ? (
                <img
                  src={imageSrc(item.image.base)}
                  srcSet={srcSet(item.image.base)}
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 72vw"
                  width={item.image.w}
                  height={item.image.h}
                  alt={item.image.alt || `Серия «${item.name}»`}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-slow ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              ) : null}
            </span>
            <span className="flex flex-1 flex-col gap-1 p-4">
              <span className="inline-flex items-center gap-1.5 font-display text-lg leading-snug">
                {item.name}
                <ExternalLink className="size-3.5 shrink-0 text-fg-muted" aria-hidden="true" />
                <span className="sr-only">(откроется на dvk-style.ru в новой вкладке)</span>
              </span>
              {item.count ? (
                <span className="tabular text-sm text-fg-muted">
                  {item.count} {plural(item.count, POSITION_FORMS)} на сайте
                </span>
              ) : null}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function IndustryView({ industry }) {
  const { id: variantId, ui } = useVariant();
  const { openQuickView, quickView } = useQuickView();
  const found = queryProducts({ industry: industry.id });
  const preview = found.items.slice(0, PREVIEW_COUNT);
  const categories = (industry.categoryIds ?? []).map((id) => getCategory(id)).filter(Boolean);
  const projects = getProjects().filter((project) => project.industry === industry.id);
  const series = industry.series ?? [];
  const equipmentTypes = industry.equipmentTypes ?? [];

  usePageTitle(`Решения: ${industry.name}`);

  return (
    <main className="page page-solution" data-direction={industry.directions?.[0]}>
      <Container className="pt-8 md:pt-12">
        <ui.PageHeader
          title={industry.name}
          lead={industry.summary}
          breadcrumbs={[
            { label: 'Главная', to: `/${variantId}` },
            { label: 'Решения' },
            { label: industry.name },
          ]}
          className="border-b-0 pb-4 md:pb-6"
        />
        <IndustryNav current={industry.id} variantId={variantId} />
      </Container>

      {series.length ? (
        <Container className="mt-10 md:mt-14">
          <ui.Reveal>
            <ui.SectionHeading
              title="Серии оборудования"
              lead={`${series.length} ${plural(series.length, SERIES_FORMS)} из каталога dvk-style.ru. Число позиций — по данным сайта.`}
            />
            <div className="mt-6">
              <SeriesList series={series} />
            </div>
          </ui.Reveal>
        </Container>
      ) : null}

      {equipmentTypes.length ? (
        <Container className="mt-12 md:mt-20">
          <ui.Reveal>
            <ui.SectionHeading title="Типы оборудования" />
            <dl className="mt-6 border-t border-line">
              {equipmentTypes.map((type) => (
                <div key={type.name} className="grid gap-1 border-b border-line py-5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10">
                  <dt className="font-display text-xl leading-snug">{type.name}</dt>
                  <dd className="max-w-[62ch] text-base text-pretty text-fg-muted">{type.text}</dd>
                </div>
              ))}
            </dl>
          </ui.Reveal>
        </Container>
      ) : null}

      {preview.length ? (
        <Container className="mt-12 md:mt-20">
          <ui.Reveal>
            <ui.SectionHeading title={`Товары: ${industry.name.toLowerCase()}`} lead={`В прототипе — ${found.total} ${plural(found.total, PRODUCT_FORMS)} отрасли.`} />
            <div className="mt-6">
              <ui.ProductList products={preview} onQuickView={openQuickView} />
            </div>
            <div className="mt-6">
              <ui.Button variant="secondary" to={buildCatalogUrl(variantId, { industry: industry.id })}>
                Все товары отрасли в каталоге
              </ui.Button>
            </div>
          </ui.Reveal>
        </Container>
      ) : null}

      {categories.length ? (
        <Container className="mt-12 md:mt-20">
          <ui.Reveal>
            <ui.SectionHeading title="Разделы каталога для отрасли" />
            <ul className="mt-6 grid gap-x-10 border-t border-line md:grid-cols-2">
              {categories.map((category) => (
                <li key={category.id} className="border-b border-line">
                  <Link
                    to={buildCatalogUrl(variantId, { direction: category.directionId, section: category.sectionId, category: category.id })}
                    className="flex items-baseline justify-between gap-4 py-3 text-base text-fg transition-[opacity] duration-fast ease-out hover:bg-surface-2"
                  >
                    <span>{category.name}</span>
                    <span className="tabular text-sm text-fg-muted" title="Позиций на dvk-style.ru">
                      {category.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </ui.Reveal>
        </Container>
      ) : null}

      {projects.length ? (
        <Container className="mt-12 md:mt-20">
          <ui.Reveal>
            <ui.SectionHeading title="Наши проекты" />
            <ul className="mt-6 flex flex-col border-t border-line">
              {projects.map((project) => (
                <li key={project.slug} className="border-b border-line">
                  <Link
                    to={`/${variantId}/projects/${project.slug}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3.5 text-base text-fg transition-[opacity] duration-fast ease-out hover:bg-surface-2"
                  >
                    <span>{project.title}</span>
                    {project.city ? <span className="text-sm text-fg-muted">{project.city}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </ui.Reveal>
        </Container>
      ) : null}

      <RequestCta title={`Подберём оборудование: ${industry.name.toLowerCase()}`} />
      {quickView}
    </main>
  );
}

export default function SolutionPage() {
  const { industry: slug } = useParams();
  const industry = getIndustry(slug);
  if (!industry) return <NotFoundPage what="отрасль" />;
  return <IndustryView key={industry.id} industry={industry} />;
}
