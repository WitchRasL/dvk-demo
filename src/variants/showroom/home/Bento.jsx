// «Выбор направления» — bento-каталог. Три направления — три равных зала; внутри разделы — плитки разного размера.
// Фишка: когда зал вошёл в окно, над плитками по очереди зажигаются светильники (конус сверху, clip-path круга);
// курсор — луч: латунная Spotlight-рамка и тёплое пятно на фото идут за мышью (transform).
import { useRef } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { getDirectionTotal, getProduct, getProject } from '../../../core/catalog/index.js';
import { useFinePointer, usePrefersReducedMotion } from '../../../core/hooks/media.js';
import { useNav } from '../../../core/layout/nav.js';
import { countText, wordFor } from '../../../core/ui/format.js';
import { imageSrc, srcSet } from '../../../lib/images.js';
import { cn } from '../../../lib/utils.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { useLitOnView, usePointerLight } from '../light.js';
import { Button, SectionHeading } from '../ui.jsx';

/** Какой кадр у раздела: фото реального объекта ДВК (крупная плитка) или товар на подиуме. */
const SECTION_MEDIA = {
  'trade-equipment': { project: 'museum-bryansk', image: 1 },
  'pharmacy-equipment': { product: 'vitriny-peredney-linii' },
  'trade-islands': { product: 'torgovyy-modul-tmd-3210' },
  playgrounds: { project: 'playground-voronezh', image: 2 },
  benches: { product: 'skamya-parkovaya-s-75-v-arkhitekturnoy-kroshke-1' },
  'small-architectural-forms': { product: 'urna-u-205' },
  'metal-furniture': { project: 'workshop-furniture', image: 0 },
  'metal-cabinets': { product: 'shkaf-instrumentalnyy-hard-2000-062000' },
  'metal-racks': { product: 'stellazh-metallicheskiy-ms-pro-2500-1010x800-4' },
};

function mediaFor(sectionId) {
  const spec = SECTION_MEDIA[sectionId];
  if (!spec) return null;
  if (spec.project) {
    const project = getProject(spec.project);
    const image = project?.images?.[spec.image] ?? project?.images?.[0];
    return image ? { kind: 'photo', image, alt: image.alt || project.title } : null;
  }
  const product = getProduct(spec.product);
  const image = product?.images?.[0];
  return image ? { kind: 'product', image, alt: product.name } : null;
}

function Tile({ section, size, index }) {
  const media = mediaFor(section.id);
  return (
    <li className={cn('sr-tile', `sr-tile--${size}`)} style={{ '--i': index }}>
      <Link to={section.to} className="sr-tile__link">
        <span className="sr-tile__media" data-kind={media?.kind ?? 'none'}>
          {media ? (
            <img
              src={imageSrc(media.image.base)}
              srcSet={srcSet(media.image.base)}
              sizes={size === 'lg' ? '(min-width: 1024px) 30vw, 92vw' : '(min-width: 1024px) 15vw, 46vw'}
              width={media.image.w}
              height={media.image.h}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <span className="sr-tile__dark" />
          <span className="sr-tile__cone" />
          <span className="sr-tile__beam" data-spot="" />
        </span>
        <span className="sr-tile__text">
          <span className="sr-tile__name">{section.name}</span>
          <span className="sr-tile__count tabular">
            {countText(section.count, 'position')}
          </span>
        </span>
        <span className="sr-tile__ring" aria-hidden="true">
          <span className="sr-tile__spot" data-spot="" />
        </span>
      </Link>
    </li>
  );
}

function Bay({ direction }) {
  const [ref, lit] = useLitOnView({ threshold: 0.25 });
  const total = getDirectionTotal(direction);
  const withMedia = direction.sections.filter((section) => SECTION_MEDIA[section.id]);
  const rest = direction.sections.filter((section) => !SECTION_MEDIA[section.id]);
  const [lead, ...small] = withMedia;
  return (
    <article ref={ref} className="sr-bay" data-direction={direction.id} data-lit={lit || undefined}>
      <header className="sr-bay__head">
        <h3 className="sr-bay__name">
          <Link to={direction.to}>{direction.name}</Link>
        </h3>
        <p className="sr-bay__summary">{direction.summary}</p>
      </header>
      <ul className="sr-bay__tiles">
        {lead ? <Tile section={lead} size="lg" index={0} /> : null}
        {small.map((section, index) => (
          <Tile key={section.id} section={section} size="sm" index={index + 1} />
        ))}
      </ul>
      <div className="sr-bay__foot">
        {rest.length ? (
          <ul className="sr-bay__more">
            {rest.map((section) => (
              <li key={section.id}>
                <Link to={section.to}>
                  <span>{section.name}</span>
                  <span className="tabular">{section.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <Link to={direction.to} className="sr-bay__all">
          Всё направление: <span className="tabular">{total.toLocaleString('ru-RU')}</span> {wordFor(total, 'position')}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function Bento() {
  const { id } = useVariant();
  const { directions } = useNav();
  const gridRef = useRef(null);
  const fine = useFinePointer();
  const reduce = usePrefersReducedMotion();
  usePointerLight(gridRef, { enabled: fine && !reduce });
  return (
    <section className="sr-screen sr-bento" aria-labelledby="sr-bento-title">
      <div className="sr-wrap">
        <SectionHeading
          id="sr-bento-title"
          title={
            <>
              С чего начнём: <em>витрина</em>, двор или цех?
            </>
          }
          lead="Три направления равного веса. Внутри — разделы каталога и число позиций на dvk-style.ru: выберите свой зал и идите дальше по разделам."
        />
        <div ref={gridRef} className="sr-bento__grid">
          {directions.map((direction) => (
            <Bay key={direction.id} direction={direction} />
          ))}
        </div>
        <div className="sr-bento__cta">
          <p>Не нашли свой раздел? Подберём оборудование под объект — бесплатно.</p>
          <div className="sr-bento__actions">
            <Button to={`/${id}/request`} magnetic>
              Заявка на подбор
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Button>
            <Button variant="secondary" to={`/${id}/catalog`}>
              Весь каталог
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
