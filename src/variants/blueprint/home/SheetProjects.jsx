// Лист 6 «Проекты»: реализованные объекты — каждый оформлен листом: фото в рамке и основная надпись
// (объект, город, направление, состав работ — только из данных). При входе листы «ложатся» на стол
// стопкой: сдвиг и шторка clip-path сверху вниз, один за другим.
import { useRef } from 'react';
import { Link } from 'react-router';
import { useInView } from 'motion/react';
import { UNKNOWN, getDirection, getProject } from '../../../core/catalog/index.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { imageSrc, srcSet } from '../../../lib/images.js';
import { SectionHeading } from '../ui/headings.jsx';
import { Sheet } from './Sheet.jsx';

const PROJECTS = ['duty-free-spb', 'pharmacy-vladivostok', 'playground-voronezh', 'workshop-furniture'];

export function SheetProjects() {
  const { id: variantId } = useVariant();
  const ref = useRef(null);
  const laid = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const projects = PROJECTS.map(getProject).filter(Boolean);
  return (
    <Sheet id="projects" labelledBy="bp-projects-title">
      <div className="bp-wrap">
        <div className="bp-sheet__head">
          <SectionHeading id="bp-projects-title" title="Проекты — листами" lead="Объекты, которые ДВК спроектировала и изготовила. Год и заказчик на сайте не указаны — [уточнить]." />
          <Link to={`/${variantId}/projects`} className="bp-dirs__go">
            Все проекты
          </Link>
        </div>
        <ul ref={ref} className="bp-projects rail" data-laid={laid || undefined}>
          {projects.map((project, index) => {
            const image = project.images?.[0];
            const direction = getDirection(project.direction);
            return (
              <li key={project.slug} style={{ '--i': index }}>
                <article className="bp-psheet">
                  <Link to={`/${variantId}/projects/${project.slug}`} className="bp-psheet__photo" tabIndex={-1} aria-hidden="true">
                    {image ? (
                      <img
                        src={imageSrc(image.base, 800)}
                        srcSet={srcSet(image.base)}
                        sizes="(min-width: 1024px) 45vw, 85vw"
                        width={image.w}
                        height={image.h}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                  </Link>
                  <div className="bp-psheet__stamp">
                    <h3 className="bp-psheet__title font-display">
                      <Link to={`/${variantId}/projects/${project.slug}`} className="bp-link-quiet">
                        {project.title}
                      </Link>
                    </h3>
                    <p className="bp-psheet__cell">
                      <span className="bp-cell__label">Город</span>
                      {project.city ?? UNKNOWN}
                    </p>
                    <p className="bp-psheet__cell">
                      <span className="bp-cell__label">Направление</span>
                      {direction?.name ?? UNKNOWN}
                    </p>
                    <p className="bp-psheet__cell bp-psheet__scope">
                      <span className="bp-cell__label">Состав работ</span>
                      {project.scope?.length ? project.scope.join(' · ') : UNKNOWN}
                    </p>
                    <p className="bp-psheet__cell bp-psheet__no">
                      <span className="bp-cell__label">Лист</span>
                      <span className="bp-mono">{`6.${index + 1}`}</span>
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}
