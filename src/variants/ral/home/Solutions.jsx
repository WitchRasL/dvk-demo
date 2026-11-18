// Экран «Решения по отраслям»: интерактивные табы (отрасли сгруппированы по направлениям — полями цвета),
// смена картинки — шторкой целыми модулями. Картинка — фото проекта отрасли, иначе товар отрасли на подиуме.
import { ArrowRight } from 'lucide-react';
import { buildCatalogUrl, getIndustries, getProjects, queryProducts } from '../../../core/catalog/index.js';
import { useTabs } from '../../../core/hooks/useTabs.js';
import { wordFor } from '../../../core/ui/format.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { imageSrc, srcSet } from '../../../lib/images.js';
import { cn } from '../../../lib/utils.js';
import { useFanDirections } from '../Fan.jsx';
import { Button, SectionHeading } from '../ui.jsx';

function industryVisual(industry) {
  const project = getProjects().find((item) => item.industry === industry.id && item.images?.length);
  if (project) return { kind: 'photo', image: project.images[0], caption: `${project.title}${project.city ? `, ${project.city}` : ''}` };
  const product = queryProducts({ industry: industry.id }).items.find((item) => item.images?.length);
  if (product) return { kind: 'product', image: product.images[0], caption: product.name, direction: product.direction };
  return null;
}

export function Solutions() {
  const { id } = useVariant();
  const directions = useFanDirections();
  const industries = getIndustries();
  // Табы идут в порядке показа: по направлениям. Состояние и клавиатура — общие, из ядра.
  const order = directions.flatMap((direction) => industries.filter((industry) => industry.directions?.[0] === direction.id));
  const tabs = useTabs({ count: order.length, initial: Math.max(0, order.indexOf(industries[0])) });
  const current = order[tabs.selected];
  if (!current) return null;

  const products = queryProducts({ industry: current.id });
  const visual = industryVisual(current);

  return (
    <section className="ral-section ral-solutions" data-field-scope="paper" aria-labelledby="ral-solutions-title">
      <div className="ral-wrap ral-section__head">
        <SectionHeading id="ral-solutions-title" title="Решения по отраслям" lead="Аптека, музей, двор или склад — выберите объект: что делаем, какие товары и проекты есть." />
      </div>
      <div className="ral-wrap ral-solutions__grid">
        <div className="ral-solutions__tabs" {...tabs.listProps} aria-label="Отрасли">
          {directions.map((direction) => (
            <div key={direction.id} className="ral-solutions__group" role="presentation">
              <p className="ral-solutions__groupname" aria-hidden="true">
                <span className="ral-code__chip" data-field-scope={direction.field.id} />
                <span className="ral-mono">{direction.field.code}</span> {direction.name}
              </p>
              {industries
                .filter((industry) => industry.directions?.[0] === direction.id)
                .map((industry) => {
                  const selected = industry.id === current.id;
                  return (
                    <button key={industry.id} {...tabs.tabProps(order.indexOf(industry))} className={cn('ral-solutions__tab', selected && 'is-active')}>
                      {industry.name}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        <div {...tabs.panelProps} className="ral-solutions__panel">
          <figure key={current.id} className={cn('ral-solutions__visual', visual?.kind === 'product' && 'is-product')} data-field-scope={visual?.kind === 'product' ? visual.direction : undefined}>
            {visual ? (
              <img
                src={imageSrc(visual.image.base)}
                srcSet={srcSet(visual.image.base)}
                sizes="(min-width: 1024px) 40vw, 92vw"
                width={visual.image.w}
                height={visual.image.h}
                alt={visual.image.alt || visual.caption}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="ral-solutions__nophoto">Фото [уточнить]</span>
            )}
            {visual ? <figcaption>{visual.caption}</figcaption> : null}
          </figure>
          <div className="ral-solutions__text">
            <h3 className="ral-solutions__name">{current.name}</h3>
            <p className="ral-solutions__summary">{current.summary}</p>
            <ul className="ral-solutions__facts">
              <li>
                <span className="tabular">{products.total}</span> {wordFor(products.total, 'product')} отрасли в прототипе
              </li>
              {current.series?.length ? (
                <li>
                  <span className="tabular">{current.series.length}</span> {wordFor(current.series.length, 'series')} оборудования
                </li>
              ) : null}
            </ul>
            <div className="ral-solutions__actions">
              <Button variant="primary" to={`/${id}/solutions/${current.slug}`}>
                Решение: {current.name.toLowerCase()}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" to={buildCatalogUrl(id, { industry: current.id })}>
                Товары отрасли в каталоге
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
