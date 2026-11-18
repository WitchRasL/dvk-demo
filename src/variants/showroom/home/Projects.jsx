// «Проекты» — реальные объекты ДВК. Каждая витрина закрыта тёмными створками; когда она входит в окно,
// створки разъезжаются (transform), и за ними включается свет. Наведение — свет ярче.
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { getDirection, getProject } from '../../../core/catalog/index.js';
import { imageSrc, srcSet } from '../../../lib/images.js';
import { cn } from '../../../lib/utils.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { useLitOnView } from '../light.js';
import { SectionHeading } from '../ui.jsx';

const PROJECTS = [
  { slug: 'museum-bryansk', image: 1, area: 'a' },
  { slug: 'duty-free-spb', image: 1, area: 'b' },
  { slug: 'pharmacy-vladivostok', image: 0, area: 'c' },
  { slug: 'playground-moscow', image: 0, area: 'd' },
  { slug: 'workshop-furniture', image: 0, area: 'e' },
];

function ProjectShowcase({ entry }) {
  const { id: variantId } = useVariant();
  const [ref, lit] = useLitOnView({ threshold: 0.35 });
  const project = getProject(entry.slug);
  if (!project) return null;
  const image = project.images?.[entry.image] ?? project.images?.[0];
  const direction = getDirection(project.direction);
  return (
    <li ref={ref} className={cn('sr-proj', `sr-proj--${entry.area}`)} data-lit={lit || undefined}>
      <Link to={`/${variantId}/projects/${project.slug}`} className="sr-proj__link">
        <span className="sr-proj__media">
          {image ? (
            <img
              src={imageSrc(image.base)}
              srcSet={srcSet(image.base)}
              sizes={entry.area === 'a' ? '(min-width: 1024px) 56vw, 88vw' : '(min-width: 1024px) 40vw, 88vw'}
              width={image.w}
              height={image.h}
              alt={image.alt || project.title}
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <span className="sr-proj__grade" aria-hidden="true" />
          <span className="sr-proj__door sr-proj__door--l" aria-hidden="true" />
          <span className="sr-proj__door sr-proj__door--r" aria-hidden="true" />
        </span>
        <span className="sr-proj__caption">
          <span className="sr-proj__title">{project.title}</span>
          <span className="sr-proj__meta">{[project.city, direction?.name].filter(Boolean).join(' · ')}</span>
        </span>
      </Link>
    </li>
  );
}

export function Projects() {
  const { id } = useVariant();
  return (
    <section className="sr-screen sr-projects" aria-labelledby="sr-projects-title">
      <div className="sr-wrap">
        <div className="sr-projects__head">
          <SectionHeading
            id="sr-projects-title"
            title={
              <>
                Объекты, где свет уже <em>включён</em>
              </>
            }
            lead="Музеи, магазины, аптеки, дворы и мастерские — реализованные объекты из раздела проектов dvk-style.ru."
          />
          <Link to={`/${id}/projects`} className="sr-link-arrow">
            Все проекты
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="sr-projects__grid">
          {PROJECTS.map((entry) => (
            <ProjectShowcase key={entry.slug} entry={entry} />
          ))}
        </ul>
      </div>
    </section>
  );
}
