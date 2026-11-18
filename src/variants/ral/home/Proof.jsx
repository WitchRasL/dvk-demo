// Экран «Клиенты, письма, госзаказ» — спокойный: бумага веера, плитка логотипов со швом, выдержки из писем,
// госзаказы и ТЗ к тендерам. Без движения — пауза после плотных экранов. Всё — из company.json.
import { Link } from 'react-router';
import { getCompany } from '../../../core/catalog/index.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { imageSrc } from '../../../lib/images.js';
import { SectionHeading } from '../ui.jsx';

const SERVICES = ['gov-orders', 'tender-specs', 'branding'];

export function Proof() {
  const { id } = useVariant();
  const company = getCompany();
  const clients = company.clients ?? [];
  const withLogo = clients.filter((client) => client.logo);
  const withoutLogo = clients.filter((client) => !client.logo);
  const letters = (company.letters ?? []).filter((letter) => letter.summary).slice(0, 3);
  const services = SERVICES.map((serviceId) => company.services?.find((service) => service.id === serviceId)).filter(Boolean);
  return (
    <section className="ral-section ral-proof" data-field-scope="paper" aria-labelledby="ral-proof-title">
      <div className="ral-wrap ral-proof__grid">
        <div className="ral-proof__intro">
          <SectionHeading id="ral-proof-title" title="Нам доверяют банки, музеи, заводы и администрации" lead="Клиенты и благодарственные письма — с dvk-style.ru." />
          <dl className="ral-proof__services">
            {services.map((service) => (
              <div key={service.id}>
                <dt>{service.title}</dt>
                <dd>{service.text}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="ral-proof__clients">
          <ul className="ral-logos" aria-label="Клиенты">
            {withLogo.map((client) => (
              <li key={client.name}>
                <img src={imageSrc(client.logo.base)} width={client.logo.w} height={client.logo.h} alt={client.name} loading="lazy" decoding="async" />
              </li>
            ))}
          </ul>
          {withoutLogo.length ? (
            <p className="ral-proof__more">
              А также: {withoutLogo.map((client) => client.name).join(', ')}.
            </p>
          ) : null}
        </div>
      </div>
      {letters.length ? (
        <div className="ral-wrap">
          <ul className="ral-letters" aria-label="Благодарственные письма">
            {letters.map((letter, index) => (
              <li key={`${letter.person}-${index}`}>
                <figure>
                  <blockquote>{letter.summary}</blockquote>
                  <figcaption>
                    <span className="ral-letters__who">{letter.person ?? letter.from}</span>
                    {letter.position ? <span>{letter.position}</span> : null}
                    {letter.date ? <span className="tabular">{letter.date}</span> : null}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <p className="ral-proof__all">
            <Link to={`/${id}/about`}>Все письма, клиенты и сертификаты — на странице «Производство»</Link>
          </p>
        </div>
      ) : null}
    </section>
  );
}
