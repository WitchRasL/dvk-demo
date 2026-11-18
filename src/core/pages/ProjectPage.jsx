// Кейс: /projects/:slug — фото, объект, город, что сделано. Только данные projects.json; пусто — не показываем.
import './pages.css';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { buildCatalogUrl, getDirection, getIndustry, getProject, getProjects, queryProducts } from '../catalog/index.js';
import { Container } from '../ui/layout.jsx';
import { useVariant } from '../variants/VariantContext.jsx';
import { Gallery } from './parts/Gallery.jsx';
import { useQuickView } from './parts/QuickView.jsx';
import { RequestCta } from './parts/RequestCta.jsx';
import { usePageTitle } from './parts/usePageTitle.js';
import NotFoundPage from './NotFoundPage.jsx';

function Fact({ label, children }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-t border-line py-3 first:border-t-0 first:pt-0">
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd className="text-base text-fg">{children}</dd>
    </div>
  );
}

function ProjectView({ project }) {
  const { id: variantId, ui } = useVariant();
  const { openQuickView, quickView } = useQuickView();
  const direction = getDirection(project.direction);
  const industry = project.industry ? getIndustry(project.industry) : null;
  const all = getProjects();
  const index = all.findIndex((item) => item.slug === project.slug);
  const prev = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;
  const related = industry ? queryProducts({ industry: industry.id }).items.slice(0, 4) : [];

  usePageTitle(project.title);

  return (
    <main className="page page-project" data-direction={project.direction}>
      <Container className="pt-8 md:pt-12">
        <ui.PageHeader
          title={project.title}
          lead={project.summary}
          breadcrumbs={[
            { label: 'Главная', to: `/${variantId}` },
            { label: 'Проекты', to: `/${variantId}/projects` },
            { label: project.title },
          ]}
        />
      </Container>

      <Container className="grid gap-8 py-8 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-12 lg:py-10">
        <ui.Reveal className="min-w-0">
          <Gallery images={project.images} name={project.title} layout="stack" />
        </ui.Reveal>

        <aside aria-label="О проекте" className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-[var(--page-sticky-top,1.5rem)] lg:self-start">
          <dl>
            {project.city ? <Fact label="Город">{project.city}</Fact> : null}
            {direction ? (
              <Fact label="Направление">
                <Link to={buildCatalogUrl(variantId, { direction: direction.id })} className="underline underline-offset-4 hover:no-underline">
                  {direction.name}
                </Link>
              </Fact>
            ) : null}
            {industry ? (
              <Fact label="Отрасль">
                <Link to={`/${variantId}/solutions/${industry.slug}`} className="underline underline-offset-4 hover:no-underline">
                  {industry.name}
                </Link>
              </Fact>
            ) : null}
            {project.client ? <Fact label="Заказчик">{project.client}</Fact> : null}
            {project.year ? <Fact label="Год">{project.year}</Fact> : null}
            {project.scope?.length ? (
              <Fact label="Что сделано">
                <ul className="flex flex-col gap-1">
                  {project.scope.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Fact>
            ) : null}
          </dl>
          {project.sourceUrl ? (
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-sm text-fg underline underline-offset-4 hover:no-underline"
            >
              Проект на dvk-style.ru
              <ExternalLink className="size-3.5" aria-hidden="true" />
              <span className="sr-only">(откроется в новой вкладке)</span>
            </a>
          ) : null}
          <ui.Button to={`/${variantId}/request`} className="w-full sm:w-fit">
            Заказать такое же
          </ui.Button>
        </aside>
      </Container>

      {related.length ? (
        <Container className="mt-8 md:mt-12">
          <ui.Reveal>
            <ui.SectionHeading title={`Оборудование из каталога: ${industry.name.toLowerCase()}`} />
            <div className="mt-6">
              <ui.ProductList products={related} onQuickView={openQuickView} />
            </div>
          </ui.Reveal>
        </Container>
      ) : null}

      {prev || next ? (
        <Container className="mt-12 md:mt-16">
          <nav aria-label="Другие проекты" className="grid gap-px border-y border-line sm:grid-cols-2">
            {prev ? (
              <Link to={`/${variantId}/projects/${prev.slug}`} className="flex items-center gap-3 py-5 pr-4 text-base text-fg transition-[opacity] duration-fast ease-out hover:bg-surface-2 sm:pr-8">
                <ArrowLeft className="size-5 shrink-0 text-fg-muted" aria-hidden="true" />
                <span>
                  <span className="block text-sm text-fg-muted">Предыдущий проект</span>
                  {prev.title}
                  {prev.city ? `, ${prev.city}` : ''}
                </span>
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            {next ? (
              <Link
                to={`/${variantId}/projects/${next.slug}`}
                className="flex items-center justify-between gap-3 py-5 pl-0 text-base text-fg transition-[opacity] duration-fast ease-out hover:bg-surface-2 sm:pl-8 sm:text-right"
              >
                <span>
                  <span className="block text-sm text-fg-muted">Следующий проект</span>
                  {next.title}
                  {next.city ? `, ${next.city}` : ''}
                </span>
                <ArrowRight className="size-5 shrink-0 text-fg-muted" aria-hidden="true" />
              </Link>
            ) : null}
          </nav>
        </Container>
      ) : null}

      <RequestCta title="Нужен такой же результат на вашем объекте?" />
      {quickView}
    </main>
  );
}

export default function ProjectPage() {
  const { slug } = useParams();
  const project = getProject(slug);
  if (!project) return <NotFoundPage what="проект" />;
  return <ProjectView key={project.slug} project={project} />;
}
