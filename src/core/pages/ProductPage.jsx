// Товар: /product/:slug — галерея, характеристики, цена или «по запросу», «Добавить в запрос КП»,
// похожие товары, «Как мы работаем», ссылка на товар на dvk-style.ru.
import './pages.css';
import { Link, useParams } from 'react-router';
import { ExternalLink, Phone } from 'lucide-react';
import { buildCatalogUrl, getCategory, getCompany, getDirection, getIndustry, getProduct, getSection, getSimilar } from '../catalog/index.js';
import { useCity } from '../city/index.js';
import { AddToKp } from '../ui/AddToKp.jsx';
import { formatPrice, materialLabel, toTel } from '../ui/format.js';
import { Container } from '../ui/layout.jsx';
import { useVariant } from '../variants/VariantContext.jsx';
import { cn } from '../../lib/utils.js';
import { Gallery } from './parts/Gallery.jsx';
import { HowWeWork } from './parts/HowWeWork.jsx';
import { useQuickView } from './parts/QuickView.jsx';
import { RequestCta } from './parts/RequestCta.jsx';
import { SpecTable } from './parts/SpecTable.jsx';
import { usePageTitle } from './parts/usePageTitle.js';
import NotFoundPage from './NotFoundPage.jsx';

/** Описание с сайта: абзацы по переводам строки, строки «- пункт» — списком. */
function Description({ text }) {
  const lines = String(text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const blocks = [];
  for (const line of lines) {
    const item = line.match(/^[-–—•]\s*(.+)$/);
    const last = blocks[blocks.length - 1];
    if (item && last?.type === 'list') last.items.push(item[1]);
    else if (item) blocks.push({ type: 'list', items: [item[1]] });
    else blocks.push({ type: 'p', text: line });
  }
  if (!blocks.length) return null;
  return (
    <div className="flex max-w-[68ch] flex-col gap-3 text-base text-pretty text-fg">
      {blocks.map((block, index) =>
        block.type === 'list' ? (
          <ul key={index} className="list-disc pl-5 marker:text-fg-muted">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="py-0.5">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>{block.text}</p>
        ),
      )}
    </div>
  );
}

function ProductView({ product }) {
  const { id: variantId, ui } = useVariant();
  const { contacts } = useCity();
  const { openQuickView, quickView } = useQuickView();
  const company = getCompany();
  const direction = getDirection(product.direction);
  const section = getSection(product.direction, product.sectionId);
  const category = product.categoryId ? getCategory(product.categoryId, product.sectionId) : null;
  const industries = (product.industries ?? []).map((slug) => getIndustry(slug)).filter(Boolean);
  const similar = getSimilar(product, 4);
  const phone = contacts?.phones?.[0];
  const hasPrice = typeof product.price === 'number';

  usePageTitle(product.name);

  const breadcrumbs = [
    { label: 'Главная', to: `/${variantId}` },
    { label: 'Каталог', to: buildCatalogUrl(variantId, {}) },
  ];
  if (direction) breadcrumbs.push({ label: direction.name, to: buildCatalogUrl(variantId, { direction: direction.id }) });
  if (section) breadcrumbs.push({ label: section.name, to: buildCatalogUrl(variantId, { direction: direction?.id, section: section.id }) });
  if (category) breadcrumbs.push({ label: category.name, to: buildCatalogUrl(variantId, { direction: direction?.id, section: section?.id, category: category.id }) });
  breadcrumbs.push({ label: product.name });

  return (
    <main className="page page-product" data-direction={product.direction}>
      <Container className="pt-8 md:pt-12">
        <ui.PageHeader title={product.name} breadcrumbs={breadcrumbs} />
      </Container>

      <Container className="grid gap-8 py-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14 lg:py-10">
        <ui.Reveal className="min-w-0">
          <Gallery images={product.images} name={product.name} />
        </ui.Reveal>

        <div className="flex min-w-0 flex-col gap-7 lg:sticky lg:top-[var(--page-sticky-top,1.5rem)] lg:self-start">
          <div>
            <p className={cn('tabular font-display text-3xl leading-none md:text-4xl', hasPrice ? 'text-fg' : 'text-fg-muted')}>{formatPrice(product)}</p>
            {hasPrice ? <p className="mt-2 text-sm text-fg-muted">Цена по данным dvk-style.ru.</p> : <p className="mt-2 text-sm text-fg-muted">Стоимость рассчитаем в коммерческом предложении.</p>}
          </div>

          <AddToKp product={product} mode="full" />

          <div className="flex flex-col gap-3 border-t border-line pt-5">
            <p className="max-w-[44ch] text-sm text-pretty text-fg-muted">{company.promise}</p>
            <div className="flex flex-wrap items-center gap-3">
              <ui.Button variant="secondary" to={`/${variantId}/request`}>
                Заявка на подбор
              </ui.Button>
              {phone ? (
                <ui.Button variant="ghost" href={`tel:${toTel(phone)}`}>
                  <Phone className="size-4" aria-hidden="true" />
                  <span className="tabular">{phone}</span>
                  <span className="sr-only">, {contacts.label}</span>
                </ui.Button>
              ) : null}
            </div>
          </div>

          {product.materials?.length || industries.length ? (
            <ul className="flex flex-wrap gap-2" aria-label="Материалы и отрасли">
              {product.materials?.map((material) => (
                <li key={material} className="rounded-base border border-line px-2.5 py-1 text-sm text-fg-muted">
                  {materialLabel(material)}
                </li>
              ))}
              {industries.map((industry) => (
                <li key={industry.id}>
                  <Link
                    to={`/${variantId}/solutions/${industry.slug}`}
                    className="inline-flex rounded-base border border-line px-2.5 py-1 text-sm text-fg transition-[opacity] duration-fast ease-out hover:bg-surface-2"
                  >
                    {industry.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>

      <Container className="grid gap-10 pb-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <ui.Reveal className="min-w-0">
          <section aria-labelledby="product-specs">
            <h2 id="product-specs" className="mb-3 font-display text-2xl leading-tight md:text-3xl">
              Характеристики
            </h2>
            <SpecTable product={product} />
            {product.sourceUrl ? (
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-fg underline underline-offset-4 hover:no-underline"
              >
                Смотреть товар на dvk-style.ru
                <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(откроется в новой вкладке)</span>
              </a>
            ) : null}
          </section>
        </ui.Reveal>
        {product.description ? (
          <ui.Reveal className="min-w-0" delay={0.08}>
            <section aria-labelledby="product-description">
              <h2 id="product-description" className="mb-4 font-display text-2xl leading-tight md:text-3xl">
                Описание
              </h2>
              <Description text={product.description} />
            </section>
          </ui.Reveal>
        ) : null}
      </Container>

      {similar.length ? (
        <Container className="mt-12 md:mt-20">
          <ui.Reveal>
            <ui.SectionHeading title="Похожие товары" />
            <div className="mt-6">
              <ui.ProductList products={similar} onQuickView={openQuickView} />
            </div>
          </ui.Reveal>
        </Container>
      ) : null}

      <Container className="mt-12 md:mt-20">
        <ui.Reveal>
          <HowWeWork />
        </ui.Reveal>
      </Container>

      <RequestCta />
      {quickView}
    </main>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const product = getProduct(slug);
  if (!product) return <NotFoundPage what="товар" />;
  return <ProductView key={product.id} product={product} />;
}
