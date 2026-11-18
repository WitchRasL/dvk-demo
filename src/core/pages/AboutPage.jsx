// О компании и производстве: полный цикл, факты, услуги, клиенты, благодарственные письма, сертификаты.
// Всё из company.json; чего в данных нет (годы, сканы писем) — не придумываем, а помечаем [уточнить].
import './pages.css';
import { useId, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getCompany } from '../catalog/index.js';
import { asset } from '../../lib/base-url.js';
import { imageSrc } from '../../lib/images.js';
import { plural } from '../ui/format.js';
import { Container } from '../ui/layout.jsx';
import { useVariant } from '../variants/VariantContext.jsx';
import { HowWeWork } from './parts/HowWeWork.jsx';
import { RequestCta } from './parts/RequestCta.jsx';
import { usePageTitle } from './parts/usePageTitle.js';

const CERTIFICATE_PREVIEW = 12;
const CERTIFICATE_FORMS = ['документ', 'документа', 'документов'];

function Facts({ facts }) {
  return (
    <ul className="border-t border-line">
      {facts.map((fact) => (
        <li key={fact.id} className="border-b border-line py-4 text-base text-pretty text-fg">
          {fact.text}
        </li>
      ))}
    </ul>
  );
}

function Clients({ clients }) {
  const withLogo = clients.filter((client) => client.logo);
  const withoutLogo = clients.filter((client) => !client.logo);
  return (
    <div className="flex flex-col gap-8">
      {withLogo.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {withLogo.map((client) => (
            <li key={client.name} className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface">
              <span className="flex aspect-[4/3] items-center justify-center bg-[color:var(--stage)] p-4">
                <img
                  src={imageSrc(client.logo.base)}
                  width={client.logo.w}
                  height={client.logo.h}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="max-h-full max-w-full object-contain"
                />
              </span>
              <span className="px-3 py-2.5 text-sm text-fg">{client.name}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {withoutLogo.length ? (
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-base text-fg" aria-label="Другие клиенты">
          {withoutLogo.map((client) => (
            <li key={client.name}>{client.name}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Letters({ letters }) {
  const hasScans = letters.some((letter) => letter.image);
  return (
    <div className="flex flex-col gap-5">
      <ul className="grid gap-x-12 gap-y-8 md:grid-cols-2">
        {letters.map((letter, index) => (
          <li key={`${letter.person}-${letter.date}-${index}`} className="min-w-0 border-t border-line pt-5">
            <figure className="flex h-full flex-col gap-3">
              {letter.summary ? <blockquote className="max-w-[56ch] text-base text-pretty text-fg">{letter.summary}</blockquote> : null}
              <figcaption className="mt-auto text-sm text-fg-muted">
                <span className="text-fg">{letter.person ?? letter.from}</span>
                {letter.position ? `, ${letter.position}` : ''}
                {letter.date ? <span className="tabular"> · {letter.date}</span> : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      {!hasScans ? <p className="text-sm text-fg-muted">Сканы писем: [уточнить] — на сайте опубликованы только тексты.</p> : null}
    </div>
  );
}

function Certificates({ certificates }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const visible = expanded ? certificates : certificates.slice(0, CERTIFICATE_PREVIEW);
  return (
    <div className="flex flex-col gap-6">
      <ul id={listId} className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {visible.map((certificate, index) => (
          <li key={`${certificate.image.base}-${index}`} className="min-w-0">
            <a
              href={asset(`${certificate.image.base}-1600.webp`)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col gap-2 text-sm text-fg"
            >
              <span className="block aspect-[7/10] overflow-hidden rounded-base border border-line bg-[color:var(--stage)]">
                <img
                  src={imageSrc(certificate.image.base)}
                  width={certificate.image.w}
                  height={certificate.image.h}
                  alt={certificate.image.alt || certificate.title}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-slow ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </span>
              <span className="text-pretty underline-offset-4 group-hover:underline">
                {certificate.title}
                <span className="sr-only"> (изображение откроется в новой вкладке)</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      {certificates.length > CERTIFICATE_PREVIEW ? (
        <div>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex min-h-11 items-center rounded-base border border-line px-5 text-sm font-medium text-fg transition-[opacity] duration-fast ease-out hover:bg-surface-2"
          >
            {expanded ? 'Свернуть' : `Показать все: ${certificates.length} ${plural(certificates.length, CERTIFICATE_FORMS)}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function AboutPage() {
  const { id: variantId, ui } = useVariant();
  const company = getCompany();
  const facts = company.facts ?? [];
  const services = company.services ?? [];
  const clients = company.clients ?? [];
  const letters = company.letters ?? [];
  const certificates = (company.certificates ?? []).filter((item) => item.image);

  usePageTitle('Производство и компания');

  return (
    <main className="page page-about">
      <Container className="pt-8 md:pt-12">
        <ui.PageHeader
          title="Производство и компания"
          lead={company.positioning}
          breadcrumbs={[{ label: 'Главная', to: `/${variantId}` }, { label: 'Производство' }]}
        />
      </Container>

      <Container className="mt-10 md:mt-16">
        <ui.Reveal>
          <HowWeWork
            title="Полный цикл"
            lead="Пять шагов от замера до монтажа."
          />
        </ui.Reveal>
      </Container>

      {facts.length ? (
        <Container className="mt-12 grid gap-8 md:mt-20 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
          <ui.Reveal className="min-w-0">
            <ui.SectionHeading title="Что важно знать" lead="Факты с сайта dvk-style.ru." />
          </ui.Reveal>
          <ui.Reveal className="min-w-0" delay={0.06}>
            <Facts facts={facts} />
          </ui.Reveal>
        </Container>
      ) : null}

      {services.length ? (
        <Container className="mt-12 md:mt-20">
          <ui.Reveal>
            <ui.SectionHeading title="Услуги" />
            <dl className="mt-6 border-t border-line">
              {services.map((service) => (
                <div key={service.id} className="grid gap-1 border-b border-line py-5 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-14">
                  <dt className="font-display text-xl leading-snug text-balance">{service.title}</dt>
                  <dd className="max-w-[64ch] text-base text-pretty text-fg-muted">{service.text}</dd>
                </div>
              ))}
            </dl>
          </ui.Reveal>
        </Container>
      ) : null}

      {clients.length ? (
        <Container className="mt-12 md:mt-20">
          <ui.Reveal>
            <ui.SectionHeading title="Клиенты" />
            <div className="mt-6">
              <Clients clients={clients} />
            </div>
          </ui.Reveal>
        </Container>
      ) : null}

      {letters.length ? (
        <Container className="mt-12 md:mt-20">
          <ui.Reveal>
            <ui.SectionHeading title="Благодарственные письма" />
            <div className="mt-6">
              <Letters letters={letters} />
            </div>
          </ui.Reveal>
        </Container>
      ) : null}

      {certificates.length ? (
        <Container className="mt-12 md:mt-20">
          <ui.Reveal>
            <ui.SectionHeading title="Сертификаты и свидетельства" lead="Документы с сайта dvk-style.ru: дилерские свидетельства, сертификаты соответствия, санитарно-гигиенический сертификат." />
            <div className="mt-6">
              <Certificates certificates={certificates} />
            </div>
            <a
              href="https://dvk-style.ru/company/licenses/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-fg underline underline-offset-4 hover:no-underline"
            >
              Страница лицензий на dvk-style.ru
              <ExternalLink className="size-3.5" aria-hidden="true" />
              <span className="sr-only">(откроется в новой вкладке)</span>
            </a>
          </ui.Reveal>
        </Container>
      ) : null}

      <RequestCta />
    </main>
  );
}
