// Лист 7 «Клиенты и благодарственные письма» — спокойный лист: ведомость клиентов и входящие письма с датами.
// Клиенты с логотипом на сайте — графами с логотипом, остальные из списка — строками ведомости под ними
// (пустая графа без логотипа читалась бы как незагрузившаяся картинка). Движения почти нет — мягкое проявление.
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { getCompany } from '../../../core/catalog/index.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { imageSrc } from '../../../lib/images.js';
import { SectionHeading } from '../ui/headings.jsx';
import { Sheet } from './Sheet.jsx';

const LETTERS_SHOWN = 3;

export function SheetClients() {
  const { id: variantId } = useVariant();
  const company = getCompany();
  const clients = company.clients ?? [];
  const withLogo = clients.filter((client) => client.logo);
  const listed = clients.filter((client) => !client.logo);
  const letters = (company.letters ?? []).slice(0, LETTERS_SHOWN);
  return (
    <Sheet id="clients" labelledBy="bp-clients-title" className="bp-calm">
      <div className="bp-wrap bp-clients">
        <div className="bp-clients__list">
          <SectionHeading id="bp-clients-title" title="Клиенты и благодарственные письма" lead="Ведомость клиентов — по логотипам и списку с dvk-style.ru." />
          <ul className="bp-clients__grid">
            {withLogo.map((client, index) => (
              <li key={client.name} className="bp-clients__cell">
                <span className="bp-mono bp-clients__pos" aria-hidden="true">
                  {index + 1}
                </span>
                <img src={imageSrc(client.logo.base)} width={client.logo.w} height={client.logo.h} alt="" loading="lazy" decoding="async" />
                <span className="bp-clients__name">{client.name}</span>
              </li>
            ))}
          </ul>
          {listed.length ? (
            <ul className="bp-clients__rows">
              {listed.map((client, index) => (
                <li key={client.name} className="bp-clients__row">
                  <span className="bp-mono bp-clients__row-pos" aria-hidden="true">
                    {withLogo.length + index + 1}
                  </span>
                  <span className="bp-clients__row-name">{client.name}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="bp-letters">
          <h3 className="bp-letters__title font-display">Входящие письма</h3>
          <ul>
            {letters.map((letter, index) => (
              <li key={`${letter.person}-${letter.date}-${index}`} className="bp-letters__item">
                <figure>
                  {letter.summary ? <blockquote>{letter.summary}</blockquote> : null}
                  <figcaption>
                    <span className="bp-letters__from">{letter.person ?? letter.from}</span>
                    {letter.position ? <span>{letter.position}</span> : null}
                    {letter.date ? <span className="tabular">{letter.date}</span> : null}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <p className="bp-letters__note">Сканы писем — [уточнить]: на сайте опубликованы только тексты.</p>
          <Link to={`/${variantId}/about`} className="bp-dirs__go">
            Все письма и сертификаты
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Sheet>
  );
}
