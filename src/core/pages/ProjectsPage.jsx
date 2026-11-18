// Проекты: галерея с фильтром по направлению (в URL: ?direction=retail|landscape|metal). Данные — только projects.json.
import './pages.css';
import { Link, useSearchParams } from 'react-router';
import { getDirection, getDirections, getProjects } from '../catalog/index.js';
import { imageSrc, srcSet } from '../../lib/images.js';
import { cn } from '../../lib/utils.js';
import { plural } from '../ui/format.js';
import { Container } from '../ui/layout.jsx';
import { useVariant } from '../variants/VariantContext.jsx';
import { EmptyState } from './parts/EmptyState.jsx';
import { RequestCta } from './parts/RequestCta.jsx';
import { usePageTitle } from './parts/usePageTitle.js';

const PROJECT_FORMS = ['проект', 'проекта', 'проектов'];

/** Плитка проекта: фото, название, город и направление, состав работ — только из данных. */
export function ProjectCard({ project, className }) {
  const { id: variantId } = useVariant();
  const image = project.images?.[0];
  const direction = getDirection(project.direction);
  const to = `/${variantId}/projects/${project.slug}`;
  return (
    <article className={cn('project-card group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface', className)}>
      <Link to={to} tabIndex={-1} aria-hidden="true" className="block aspect-[16/10] overflow-hidden bg-surface-2">
        {image ? (
          <img
            src={imageSrc(image.base)}
            srcSet={srcSet(image.base)}
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
            width={image.w}
            height={image.h}
            alt={image.alt || project.title}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-slow ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-display text-lg leading-snug text-balance">
          <Link to={to} className="underline-offset-4 hover:underline">
            {project.title}
          </Link>
        </h3>
        <p className="text-sm text-fg-muted">{[project.city, direction?.name].filter(Boolean).join(' · ')}</p>
        {project.scope?.length ? <p className="mt-auto pt-2 text-sm text-pretty text-fg-muted">{project.scope.join(' · ')}</p> : null}
      </div>
    </article>
  );
}

export default function ProjectsPage() {
  const { id: variantId, ui } = useVariant();
  const [searchParams] = useSearchParams();
  const requested = searchParams.get('direction');
  const direction = getDirections().find((item) => item.id === requested) ?? null; // мусор в параметре — все проекты
  const all = getProjects();
  const projects = getProjects({ direction: direction?.id });

  usePageTitle(direction ? `Проекты: ${direction.name}` : 'Проекты');

  const filterLinks = [
    { id: null, name: 'Все', count: all.length, to: `/${variantId}/projects` },
    ...getDirections().map((item) => ({
      id: item.id,
      name: item.name,
      count: getProjects({ direction: item.id }).length,
      to: `/${variantId}/projects?direction=${item.id}`,
    })),
  ];

  return (
    <main className="page page-projects" data-direction={direction?.id}>
      <Container className="pt-8 md:pt-12">
        <ui.PageHeader
          title="Проекты"
          lead="Реализованные объекты: торговое оборудование, детские площадки и металлическая мебель. Только то, что есть на dvk-style.ru."
          breadcrumbs={[{ label: 'Главная', to: `/${variantId}` }, { label: 'Проекты' }]}
        />
        <nav aria-label="Направления проектов" className="mt-6">
          <ul className="rail relative -mx-4 flex snap-x gap-2 overflow-x-auto scroll-pl-4 px-4 pb-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
            {filterLinks.map((link) => {
              const active = (link.id ?? null) === (direction?.id ?? null);
              return (
                <li key={link.id ?? 'all'} className="shrink-0 snap-start">
                  <Link
                    to={link.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex min-h-10 items-center gap-2 rounded-base border px-3.5 text-sm transition-[opacity] duration-fast ease-out',
                      active ? 'border-fg bg-surface-2 font-medium text-fg' : 'border-line text-fg hover:bg-surface-2',
                    )}
                  >
                    {link.name}
                    <span className="tabular text-fg-muted">{link.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </Container>

      <Container className="py-8 md:py-10">
        <h2 className="sr-only">Список проектов</h2>
        <p role="status" className="tabular mb-5 text-base text-fg-muted">
          {projects.length} {plural(projects.length, PROJECT_FORMS)}
        </p>
        {projects.length ? (
          <ui.Reveal key={direction?.id ?? 'all'}>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <li key={project.slug} className="min-w-0">
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </ui.Reveal>
        ) : (
          <EmptyState
            title="В этом направлении проектов пока нет"
            actions={
              <ui.Button variant="secondary" to={`/${variantId}/projects`}>
                Показать все проекты
              </ui.Button>
            }
          />
        )}
      </Container>

      <RequestCta title="Нужен такой же результат на вашем объекте?" />
    </main>
  );
}
