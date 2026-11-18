// Экран «Проекты»: фото реальных объектов ДВК с цветными плашками направлений (код RAL, объект, город, работы).
// Плашка выезжает на фото целыми модулями, когда проект попадает на экран.
import { useRef } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { getProject } from '../../../core/catalog/index.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { imageSrc, srcSet } from '../../../lib/images.js';
import { useEntrance } from '../entrance.js';
import { fieldFor } from '../palette.js';
import { Button, SectionHeading } from '../ui.jsx';

// По два проекта на направление.
const PROJECTS = ['duty-free-spb', 'playground-voronezh', 'workshop-furniture', 'museum-bryansk', 'playground-moscow', 'pallet-racks'];

function ProjectTile({ project, index }) {
  const { id } = useVariant();
  const ref = useRef(null);
  const state = useEntrance(ref, { threshold: 0.95 });
  const image = project.images?.[0];
  const field = fieldFor(project.direction);
  return (
    <li ref={ref} className="ral-project" data-entrance={state} style={{ '--i': index % 2 }}>
      <Link to={`/${id}/projects/${project.slug}`} className="ral-project__link">
        <span className="ral-project__photo">
          {image ? (
            <img
              src={imageSrc(image.base)}
              srcSet={srcSet(image.base)}
              sizes="(min-width: 1024px) 46vw, 92vw"
              width={image.w}
              height={image.h}
              alt={image.alt || project.title}
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </span>
        <span className="ral-project__plate" data-field-scope={field.id}>
          <span className="ral-project__code ral-mono">{field.code}</span>
          <span className="ral-project__title">{project.title}</span>
          <span className="ral-project__meta">{[project.city, ...(project.scope ?? [])].filter(Boolean).join(' · ')}</span>
          <ArrowUpRight className="ral-project__arrow" aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}

export function Projects() {
  const { id } = useVariant();
  const projects = PROJECTS.map((slug) => getProject(slug)).filter(Boolean);
  return (
    <section className="ral-section ral-projects" aria-labelledby="ral-projects-title">
      <div className="ral-wrap ral-section__head ral-section__head--split">
        <SectionHeading id="ral-projects-title" title="Проекты: от магазина до двора и цеха" lead="Объекты с dvk-style.ru. Цвет плашки — направление работ." />
        <Button variant="secondary" to={`/${id}/projects`}>
          Все проекты
        </Button>
      </div>
      <ul className="ral-wrap ral-projects__grid">
        {projects.map((project, index) => (
          <ProjectTile key={project.slug} project={project} index={index} />
        ))}
      </ul>
    </section>
  );
}
