// Футер «Чертежа» — основная надпись последнего листа: графы с организацией, разделами, контактами двух
// площадок и пометкой концепта. Снизу отступ под плавающий переключатель вариантов.
import { Link } from 'react-router';
import { getCompany } from '../../../core/catalog/index.js';
import { CITIES } from '../../../core/city/index.js';
import { useNav } from '../../../core/layout/nav.js';
import { toTel } from '../../../core/ui/format.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';

export function Footer() {
  const { id: variantId } = useVariant();
  const { items, directions } = useNav();
  const company = getCompany();
  const cities = CITIES.map((id) => company.cities?.[id]).filter(Boolean);
  const pages = items.filter((item) => item.id !== 'catalog');

  return (
    <footer className="bp-ft">
      <div className="bp-ft__sheet">
        <div className="bp-ft__grid">
          <div className="bp-ft__cell bp-ft__org">
            <Link to={`/${variantId}`} className="bp-ft__mark font-display">
              ДВК Стиль
            </Link>
            <p className="bp-ft__pos">{company.positioning}</p>
          </div>

          <nav aria-label="Каталог" className="bp-ft__cell">
            <p className="bp-ft__label">Каталог</p>
            <ul className="bp-ft__links">
              {directions.map((direction) => (
                <li key={direction.id}>
                  <Link to={direction.to} className="bp-link-quiet">
                    {direction.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Разделы сайта" className="bp-ft__cell">
            <p className="bp-ft__label">Компания</p>
            <ul className="bp-ft__links">
              {pages.map((item) => (
                <li key={item.id}>
                  <Link to={item.to} className="bp-link-quiet">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to={`/${variantId}/request`} className="bp-link-quiet">
                  Запрос КП
                </Link>
              </li>
            </ul>
          </nav>

          {cities.map((city) => (
            <div key={city.label} className="bp-ft__cell">
              <p className="bp-ft__label">{city.label}</p>
              <address className="bp-ft__addr">
                <span>{city.address}</span>
                {city.phones?.slice(0, 2).map((phone) => (
                  <a key={phone} href={`tel:${toTel(phone)}`} className="bp-link-quiet tabular">
                    {phone}
                  </a>
                ))}
                {city.emails?.map((email) => (
                  <a key={email} href={`mailto:${email}`} className="bp-link-quiet">
                    {email}
                  </a>
                ))}
              </address>
            </div>
          ))}
        </div>

        <div className="bp-ft__stamp">
          <p className="bp-ft__cell bp-ft__concept">Концепт редизайна dvk-style.ru</p>
          <p className="bp-ft__cell">{company.legalName}</p>
          <p className="bp-ft__cell">
            <Link to={`/${variantId}/privacy`} className="bp-link-quiet">
              Политика обработки персональных данных
            </Link>
          </p>
          <p className="bp-ft__cell bp-ft__src">
            Данные:{' '}
            <a href="https://dvk-style.ru" target="_blank" rel="noopener noreferrer" className="bp-link-quiet">
              dvk-style.ru
              <span className="sr-only"> (откроется в новой вкладке)</span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
