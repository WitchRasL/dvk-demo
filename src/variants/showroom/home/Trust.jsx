// «Клиенты, письма и госзаказ» — спокойный экран без движения: логотипы на каменных табличках,
// выдержки из благодарственных писем и работа с госзаказом. Только данные company.json.
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { getCompany } from '../../../core/catalog/index.js';
import { imageSrc } from '../../../lib/images.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { SectionHeading } from '../ui.jsx';

const LETTERS_SHOWN = 3;

export function Trust() {
  const { id } = useVariant();
  const company = getCompany();
  const clients = company.clients ?? [];
  const withLogo = clients.filter((client) => client.logo);
  const others = clients.filter((client) => !client.logo);
  const letters = (company.letters ?? []).slice(0, LETTERS_SHOWN);
  // Госзаказ: один факт (опыт и площадки) и одна услуга — без повтора заголовка и «более 9 лет».
  const services = company.services ?? [];
  const govFact = services.find((service) => service.id === 'gov-orders');
  const tenderSpecs = services.find((service) => service.id === 'tender-specs');

  return (
    <section className="sr-screen sr-trust" aria-labelledby="sr-trust-title">
      <div className="sr-wrap">
        <SectionHeading
          id="sr-trust-title"
          title={
            <>
              Нам доверяют музеи, банки и <em>заводы</em>
            </>
          }
          lead="Клиенты и благодарственные письма — с сайта dvk-style.ru."
        />

        {withLogo.length ? (
          <ul className="sr-trust__logos" aria-label="Клиенты">
            {withLogo.map((client) => (
              <li key={client.name}>
                <span className="sr-trust__plaque">
                  <img src={imageSrc(client.logo.base)} width={client.logo.w} height={client.logo.h} alt={client.name} loading="lazy" decoding="async" />
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {others.length ? (
          <p className="sr-trust__others">
            Также среди клиентов: {others.map((client) => client.name).join(', ')}.
          </p>
        ) : null}

        <div className="sr-trust__columns">
          <div className="sr-trust__letters">
            <h3 className="sr-trust__subtitle">Из благодарственных писем</h3>
            <ul>
              {letters.map((letter, index) => (
                <li key={`${letter.person}-${index}`}>
                  <figure>
                    <blockquote>{letter.summary}</blockquote>
                    <figcaption>
                      <span>{letter.person ?? letter.from}</span>
                      {letter.position ? `, ${letter.position}` : ''}
                      {letter.date ? <span className="tabular"> · {letter.date}</span> : null}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            <p className="sr-trust__note">
              Сканы писем: [уточнить].{' '}
              <Link to={`/${id}/about`} className="sr-link-arrow">
                Все письма и сертификаты
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </p>
          </div>

          {govFact || tenderSpecs ? (
            <aside className="sr-trust__gov" aria-labelledby="sr-trust-gov">
              <h3 id="sr-trust-gov" className="sr-trust__subtitle">
                Госзаказ и тендеры
              </h3>
              {govFact ? <p className="sr-trust__gov-fact">{govFact.text}</p> : null}
              {tenderSpecs ? (
                <p className="sr-trust__gov-service">
                  <span>{tenderSpecs.title}.</span> {tenderSpecs.text}
                </p>
              ) : null}
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  );
}
