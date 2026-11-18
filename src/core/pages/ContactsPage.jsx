// Контакты: обе площадки сразу, выбранный город первым; реквизиты; кнопка заявки.
import './pages.css';
import { Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { getCompany } from '../catalog/index.js';
import { CITIES, useCity } from '../city/index.js';
import { toTel } from '../ui/format.js';
import { Container } from '../ui/layout.jsx';
import { useVariant } from '../variants/VariantContext.jsx';
import { cn } from '../../lib/utils.js';
import { RequestCta } from './parts/RequestCta.jsx';
import { usePageTitle } from './parts/usePageTitle.js';

const linkClass = 'inline-flex min-h-9 items-center gap-2 text-base text-fg underline-offset-4 hover:underline';

function Row({ icon: Icon, label, children }) {
  return (
    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 gap-y-0.5 py-3">
      <Icon className="mt-1 size-5 text-fg-muted" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-sm text-fg-muted">{label}</dt>
        <dd className="text-base text-fg">{children}</dd>
      </div>
    </div>
  );
}

function CityBlock({ cityId, contacts, selected, onSelect }) {
  const { ui } = useVariant();
  const headingId = `contacts-${cityId}`;
  return (
    <section aria-labelledby={headingId} className={cn('contacts-city min-w-0 border-t pt-6', selected ? 'border-fg' : 'border-line')} data-selected={selected || undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="font-display text-2xl leading-tight md:text-3xl">
          {contacts.label}
        </h2>
        {selected ? (
          <span className="rounded-base border border-line px-2.5 py-1 text-sm text-fg-muted">Ваш город в шапке</span>
        ) : (
          <ui.Button variant="secondary" size="sm" onClick={onSelect}>
            Показывать в шапке
            <span className="sr-only">: {contacts.label}</span>
          </ui.Button>
        )}
      </div>

      <dl className="mt-3 divide-y divide-line">
        <Row icon={MapPin} label={contacts.note ? `Адрес · ${contacts.note.toLowerCase()}` : 'Адрес'}>
          {contacts.address}
          {contacts.mapUrl ? (
            <a href={contacts.mapUrl} target="_blank" rel="noopener noreferrer" className={cn(linkClass, 'mt-1 flex text-sm')}>
              Открыть в Яндекс Картах
              <ExternalLink className="size-3.5" aria-hidden="true" />
              <span className="sr-only">(откроется в новой вкладке)</span>
            </a>
          ) : null}
        </Row>
        {contacts.extraAddresses?.map((extra) => (
          <Row key={extra.address} icon={MapPin} label="Ещё адрес">
            {extra.address}
            {extra.phones?.length ? <span className="tabular block text-sm text-fg-muted">{extra.phones.join(', ')}</span> : null}
          </Row>
        ))}
        {contacts.phones?.length ? (
          <Row icon={Phone} label="Телефоны">
            <ul className="flex flex-col">
              {contacts.phones.map((phone) => (
                <li key={phone}>
                  <a href={`tel:${toTel(phone)}`} className={cn(linkClass, 'tabular')}>
                    {phone}
                  </a>
                </li>
              ))}
            </ul>
          </Row>
        ) : null}
        {contacts.emails?.length ? (
          <Row icon={Mail} label="Почта">
            <ul className="flex flex-col">
              {contacts.emails.map((email) => (
                <li key={email}>
                  <a href={`mailto:${email}`} className={linkClass}>
                    {email}
                  </a>
                </li>
              ))}
            </ul>
          </Row>
        ) : null}
        <Row icon={Clock} label="Режим работы">
          {contacts.hours ? contacts.hours : <span className="text-fg-muted">[уточнить]</span>}
        </Row>
      </dl>
    </section>
  );
}

const REQUISITE_FIELDS = [
  ['fullName', 'Полное наименование'],
  ['inn', 'ИНН'],
  ['kpp', 'КПП'],
  ['registrationNumber', 'ОГРН'],
  ['okpo', 'ОКПО'],
  ['okato', 'ОКАТО'],
  ['okopf', 'ОКОПФ'],
  ['legalAddress', 'Юридический адрес'],
  ['postalAddress', 'Почтовый адрес'],
  ['bank', 'Банк'],
  ['account', 'Расчётный счёт'],
  ['corrAccount', 'Корреспондентский счёт'],
  ['bik', 'БИК'],
];

function Requisites({ requisites }) {
  const rows = REQUISITE_FIELDS.filter(([key]) => requisites[key]);
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid border-t border-line md:grid-cols-2 md:gap-x-12">
        {rows.map(([key, label]) => (
          <div key={key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-b border-line py-3">
            <dt className="text-sm text-fg-muted">{label}</dt>
            <dd className="tabular min-w-0 text-base break-words text-fg">{requisites[key]}</dd>
          </div>
        ))}
      </dl>
      <p className="max-w-[68ch] text-sm text-fg-muted">
        [уточнить] Наименование юрлица: в реквизитах на dvk-style.ru — «ДВК Элит», в остальных текстах сайта — «ДВК Стиль».
      </p>
    </div>
  );
}

export default function ContactsPage() {
  const { id: variantId, ui } = useVariant();
  const { city, setCity } = useCity();
  const company = getCompany();
  usePageTitle('Контакты');

  const ordered = [city, ...CITIES.filter((id) => id !== city)].filter((id) => company.cities?.[id]);

  return (
    <main className="page page-contacts">
      <Container className="pt-8 md:pt-12">
        <ui.PageHeader
          title="Контакты"
          lead="Две площадки: Санкт-Петербург и Москва. Выбранный в шапке город — первым."
          breadcrumbs={[{ label: 'Главная', to: `/${variantId}` }, { label: 'Контакты' }]}
        >
          <ui.Button to={`/${variantId}/request`}>Заявка на подбор</ui.Button>
        </ui.PageHeader>
      </Container>

      <Container className="grid gap-10 py-10 md:py-14 lg:grid-cols-2 lg:gap-14">
        {ordered.map((id) => (
          <ui.Reveal key={id} className="min-w-0">
            <CityBlock cityId={id} contacts={company.cities[id]} selected={id === city} onSelect={() => setCity(id)} />
          </ui.Reveal>
        ))}
      </Container>

      {company.requisites ? (
        <Container className="mt-2 md:mt-6">
          <ui.Reveal>
            <ui.SectionHeading title="Реквизиты" lead="По данным dvk-style.ru." />
            <div className="mt-6">
              <Requisites requisites={company.requisites} />
            </div>
          </ui.Reveal>
        </Container>
      ) : null}

      <RequestCta />
    </main>
  );
}
