// «Решения по отраслям» — интерактивные табы. Выбор отрасли «включает свет» в витрине справа:
// новый кадр раскрывается кругом света от точки (clip-path), текст из полутени становится ярким.
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { buildCatalogUrl, getCategory, getIndustry, getProduct, getProject } from '../../../core/catalog/index.js';
import { useTabs } from '../../../core/hooks/useTabs.js';
import { countText } from '../../../core/ui/format.js';
import { imageSrc, srcSet } from '../../../lib/images.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { displayName, photoKind } from '../media-kind.js';
import { SectionHeading } from '../ui.jsx';

/** Отрасли экрана (спецификация, «Экраны главной») и кадр для каждой: фото объекта ДВК или товар отрасли. */
const INDUSTRIES = [
  { id: 'pharmacy', project: 'pharmacy-vladivostok', image: 0 },
  { id: 'jewelry', product: 'vitrina-dlya-chasov-vchyu-23' },
  { id: 'optics', product: 'vitrina-pristennaya-s-nakopitelem-vod-24' },
  { id: 'museums', project: 'museum-bryansk', image: 1 },
  { id: 'apparel', project: 'shoes-perm', image: 0 },
  { id: 'mall-islands', product: 'torgovyy-modul-tmd-3210' },
  { id: 'yards-schools', product: 'igrovoy-kompleks-mgm-78-korablik' },
  { id: 'warehouses', project: 'pallet-racks', image: 0 },
];

function frameOf(entry) {
  if (entry.project) {
    const project = getProject(entry.project);
    const image = project?.images?.[entry.image] ?? project?.images?.[0];
    return image ? { kind: 'photo', image, caption: `${project.title}${project.city ? `, ${project.city}` : ''} — объект ДВК` } : null;
  }
  const product = getProduct(entry.product);
  const image = product?.images?.[0];
  return image ? { kind: photoKind(product), image, caption: displayName(product.name) } : null;
}

/** Сколько позиций в разделах отрасли на dvk-style.ru (сумма по категориям из данных); нет категорий — 0. */
function positionsOf(industry) {
  return (industry.categoryIds ?? []).reduce((sum, id) => sum + (Number(getCategory(id)?.count) || 0), 0);
}

export function Industries() {
  const { id: variantId } = useVariant();
  const list = INDUSTRIES.map((entry) => ({ ...entry, industry: getIndustry(entry.id) })).filter((entry) => entry.industry);
  const tabs = useTabs({ count: list.length }); // состояние и клавиатура табов — общие, из ядра
  const current = list[tabs.selected];
  if (!current) return null;
  const { industry } = current;
  const frame = frameOf(current);
  const positions = positionsOf(industry);
  const series = industry.series?.length ?? 0;

  return (
    <section className="sr-screen sr-industries" aria-labelledby="sr-industries-title">
      <div className="sr-wrap">
        <SectionHeading
          id="sr-industries-title"
          title={
            <>
              Решения для вашего <em>объекта</em>
            </>
          }
          lead="Аптека, ювелирный салон, музей или склад — у каждой отрасли свой набор оборудования в каталоге ДВК."
        />
        <div className="sr-industries__layout">
          <div {...tabs.listProps} aria-label="Отрасли" className="sr-industries__tabs">
            {list.map((entry, index) => (
              <button key={entry.id} {...tabs.tabProps(index)} className="sr-industries__tab">
                <span className="sr-industries__tab-lamp" aria-hidden="true" />
                {entry.industry.name}
              </button>
            ))}
          </div>

          <div {...tabs.panelProps} className="sr-industries__panel">
            <figure key={current.id} className="sr-industries__frame" data-kind={frame?.kind ?? 'none'}>
              {frame ? (
                <img
                  src={imageSrc(frame.image.base, 1600)}
                  srcSet={srcSet(frame.image.base)}
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  width={frame.image.w}
                  height={frame.image.h}
                  alt={displayName(frame.image.alt) || frame.caption}
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              <span className="sr-industries__light" aria-hidden="true" />
              {frame ? <figcaption>{frame.caption}</figcaption> : null}
            </figure>
            <div key={`${current.id}-text`} className="sr-industries__text">
              <h3 className="sr-industries__name">{industry.name}</h3>
              <p className="sr-industries__summary">{industry.summary}</p>
              <dl className="sr-industries__facts">
                {series ? (
                  <div>
                    <dt>Готовые серии</dt>
                    <dd className="tabular">
                      {countText(series, 'series')}
                    </dd>
                  </div>
                ) : null}
                {positions ? (
                  <div>
                    <dt>В разделах отрасли на dvk-style.ru</dt>
                    <dd className="tabular">
                      {countText(positions, 'position')}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <div className="sr-industries__links">
                <Link to={`/${variantId}/solutions/${industry.slug}`} className="sr-link-arrow">
                  Решение: {industry.name.toLowerCase()}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
                <Link to={buildCatalogUrl(variantId, { industry: industry.id })} className="sr-link-arrow sr-link-arrow--muted">
                  Товары отрасли в каталоге
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
