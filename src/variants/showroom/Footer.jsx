// Футер «Шоурума»: витрина гаснет последней — позиционирование, заявка, разделы, обе площадки и пометка концепта.
// Нижний отступ ≥ 72px: в левом нижнем углу плавает переключатель вариантов.
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { getCompany } from '../../core/catalog/index.js';
import { CITIES, useCity } from '../../core/city/index.js';
import { useNav } from '../../core/layout/nav.js';
import { toTel } from '../../core/ui/format.js';
import { useVariant } from '../../core/variants/VariantContext.jsx';
import { Logo } from './Header.jsx';
import { Button } from './ui.jsx';

const FOOTER_INDUSTRIES = ['pharmacy', 'jewelry', 'museums', 'mall-islands', 'yards-schools', 'warehouses'];

export function Footer() {
  const { id } = useVariant();
  const { items, directions } = useNav();
  const { city, contacts } = useCity();
  const company = getCompany();
  const phone = contacts?.phones?.[0];
  const industries = (items.find((item) => item.id === 'solutions')?.children ?? []).filter((item) => FOOTER_INDUSTRIES.includes(item.id));
  const pages = items.filter((item) => !item.children);
  const cities = [city, ...CITIES.filter((other) => other !== city)].filter((cityId) => company.cities?.[cityId]);

  return (
    <footer className="sr-footer">
      <span className="sr-footer__lamp" aria-hidden="true" />
      <div className="sr-wrap sr-footer__top">
        <div className="sr-footer__brand">
          <Logo to={`/${id}`} />
          <p className="sr-footer__claim">{company.positioning}</p>
        </div>
        <div className="sr-footer__act">
          <Button to={`/${id}/request`}>
            Заявка на подбор
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Button>
          {phone ? (
            <a href={`tel:${toTel(phone)}`} className="sr-footer__phone tabular">
              {phone}
              <span className="sr-only">, {contacts.label}</span>
            </a>
          ) : null}
          <p className="sr-footer__promise">{company.promise}</p>
        </div>
      </div>

      <div className="sr-wrap sr-footer__cols">
        <nav aria-label="Каталог в подвале" className="sr-footer__col">
          <h2 className="sr-footer__title">Каталог</h2>
          <ul>
            {directions.map((direction) => (
              <li key={direction.id}>
                <Link to={direction.to}>{direction.name}</Link>
              </li>
            ))}
            <li>
              <Link to={`/${id}/catalog`}>Весь каталог</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Решения в подвале" className="sr-footer__col">
          <h2 className="sr-footer__title">Решения</h2>
          <ul>
            {industries.map((industry) => (
              <li key={industry.id}>
                <Link to={industry.to}>{industry.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Компания в подвале" className="sr-footer__col">
          <h2 className="sr-footer__title">Компания</h2>
          <ul>
            {pages.map((item) => (
              <li key={item.id}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
            <li>
              <Link to={`/${id}/request`}>Запрос КП и квиз</Link>
            </li>
          </ul>
        </nav>
        <div className="sr-footer__col sr-footer__col--contacts">
          <h2 className="sr-footer__title">Площадки</h2>
          <ul className="sr-footer__cities">
            {cities.map((cityId) => {
              const place = company.cities[cityId];
              return (
                <li key={cityId}>
                  <h3 className="sr-footer__city">{place.label}</h3>
                  <p className="sr-footer__address">{place.address}</p>
                  {place.phones?.[0] ? (
                    <a href={`tel:${toTel(place.phones[0])}`} className="tabular">
                      <span className="sr-only">{place.label}: </span>
                      {place.phones[0]}
                    </a>
                  ) : null}
                  {place.emails?.[0] ? (
                    <a href={`mailto:${place.emails[0]}`}>
                      <span className="sr-only">{place.label}: </span>
                      {place.emails[0]}
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="sr-wrap sr-footer__base">
        <p className="sr-footer__concept">Концепт редизайна dvk-style.ru</p>
        <p>Фото, товары и сведения о компании — с dvk-style.ru</p>
        <Link to={`/${id}/privacy`}>Политика обработки персональных данных</Link>
      </div>
    </footer>
  );
}
