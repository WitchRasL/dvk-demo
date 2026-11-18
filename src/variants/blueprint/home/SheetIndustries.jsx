// Лист 4 «Решения по отраслям»: табы-ведомость слева, справа — лист отрасли: фото (проект ДВК или товар),
// описание с сайта и счётчики из данных. Смена таба — фото «перелистывается» шторкой clip-path.
import { useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { buildCatalogUrl, getIndustry, getProjects, queryProducts } from '../../../core/catalog/index.js';
import { plural } from '../../../core/ui/format.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { imageSrc, srcSet } from '../../../lib/images.js';
import { cn } from '../../../lib/utils.js';
import { heroConfig } from '../lib/hero.js';
import { SectionHeading } from '../ui/headings.jsx';
import { Sheet } from './Sheet.jsx';

const INDUSTRY_IDS = ['pharmacy', 'jewelry', 'optics', 'museums', 'apparel', 'mall-islands', 'yards-schools', 'warehouses'];
const PRODUCT_FORMS = ['товар', 'товара', 'товаров'];
const SERIES_FORMS = ['серия', 'серии', 'серий'];
const PROJECT_FORMS = ['проект', 'проекта', 'проектов'];

/** Первые предложения описания отрасли с сайта, не длиннее ~260 знаков. */
function shortText(text, limit = 260) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (value.length <= limit) return value;
  const sentences = value.match(/[^.!?]+[.!?]+/g) ?? [value];
  let out = '';
  for (const sentence of sentences) {
    if ((out + sentence).length > limit) break;
    out += sentence;
  }
  return (out || `${value.slice(0, limit).replace(/\s+\S*$/, '')}…`).trim();
}

function industryEntry(id) {
  const industry = getIndustry(id);
  if (!industry) return null;
  const projects = getProjects().filter((project) => project.industry === industry.id);
  const products = queryProducts({ industry: industry.id });
  const projectImage = projects
    .flatMap((project) => project.images ?? [])
    .find((image) => image.base !== heroConfig.poster?.base);
  const productImage = products.items.find((product) => product.images?.length)?.images[0];
  return {
    industry,
    projects,
    total: products.total,
    image: projectImage ?? productImage ?? null,
    kind: projectImage ? 'photo' : 'product',
  };
}

export function SheetIndustries() {
  const { id: variantId } = useVariant();
  const entries = INDUSTRY_IDS.map(industryEntry).filter(Boolean);
  const [active, setActive] = useState(0);
  const tabsRef = useRef([]);
  const baseId = useId();
  const current = entries[active];
  if (!current) return null;

  const select = (index) => {
    const next = (index + entries.length) % entries.length;
    setActive(next);
    tabsRef.current[next]?.focus();
  };

  const onKeyDown = (event) => {
    const keys = { ArrowDown: active + 1, ArrowRight: active + 1, ArrowUp: active - 1, ArrowLeft: active - 1, Home: 0, End: entries.length - 1 };
    if (event.key in keys) {
      event.preventDefault();
      select(keys[event.key]);
    }
  };

  const { industry, image, kind, total, projects } = current;
  const series = industry.series?.length ?? 0;

  return (
    <Sheet id="industries" labelledBy="bp-industries-title">
      <div className="bp-wrap">
        <SectionHeading
          id="bp-industries-title"
          title="Решения по отраслям"
          lead="Аптека, ювелирный салон, музей, двор или склад — у каждой отрасли свой набор оборудования и свой лист."
        />
        <div className="bp-ind">
          <div className="bp-ind__tabs" role="tablist" aria-label="Отрасли" aria-orientation="vertical" onKeyDown={onKeyDown}>
            {entries.map((entry, index) => (
              <button
                key={entry.industry.id}
                ref={(node) => {
                  tabsRef.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${index}`}
                aria-selected={index === active}
                aria-controls={`${baseId}-panel`}
                tabIndex={index === active ? 0 : -1}
                className="bp-ind__tab"
                onClick={() => setActive(index)}
              >
                <span className="bp-mono bp-ind__pos">{index + 1}</span>
                <span className="bp-ind__tab-name">{entry.industry.name}</span>
              </button>
            ))}
          </div>

          <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${active}`} className="bp-ind__panel" tabIndex={0}>
            <div key={industry.id} className={cn('bp-ind__media', kind === 'product' && 'is-product')}>
              {image ? (
                <img
                  src={imageSrc(image.base, 800)}
                  srcSet={srcSet(image.base)}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  width={image.w}
                  height={image.h}
                  alt={image.alt || industry.name}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="bp-media__nophoto">Фото [уточнить]</span>
              )}
              <span className="bp-ind__view bp-mono" aria-hidden="true">
                {kind === 'photo' ? 'Проект ДВК' : 'Позиция каталога'}
              </span>
            </div>
            <div key={`${industry.id}-text`} className="bp-ind__text">
              <h3 className="bp-ind__name font-display">{industry.name}</h3>
              <p className="bp-ind__summary">{shortText(industry.summary)}</p>
              <dl className="bp-ind__facts">
                <div>
                  <dt>В прототипе</dt>
                  <dd className="tabular">
                    {total} {plural(total, PRODUCT_FORMS)}
                  </dd>
                </div>
                {series ? (
                  <div>
                    <dt>Готовые серии</dt>
                    <dd className="tabular">
                      {series} {plural(series, SERIES_FORMS)}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt>Проекты</dt>
                  <dd className="tabular">{projects.length ? `${projects.length} ${plural(projects.length, PROJECT_FORMS)}` : '[уточнить]'}</dd>
                </div>
              </dl>
              <div className="bp-ind__links">
                <Link to={`/${variantId}/solutions/${industry.slug}`} className="bp-dirs__go">
                  Решение для отрасли
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                {total ? (
                  <Link to={buildCatalogUrl(variantId, { industry: industry.id })} className="bp-link">
                    Товары в каталоге
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
