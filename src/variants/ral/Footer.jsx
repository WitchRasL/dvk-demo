// Футер «Палитры RAL»: антрацит RAL 7016, веер направлений, обе площадки, пометка концепта (R63).
// Нижний отступ ≥ 72px — под плавающим переключателем вариантов.
import { Link } from 'react-router';
import { ExternalLink } from 'lucide-react';
import { getCompany } from '../../core/catalog/index.js';
import { CITIES } from '../../core/city/index.js';
import { toTel } from '../../core/ui/format.js';
import { useVariant } from '../../core/variants/VariantContext.jsx';
import { DirectionSwatch, useFanDirections } from './Fan.jsx';
import { ModuleRule } from './ui.jsx';

export function Footer() {
  const { id } = useVariant();
  const company = getCompany();
  const directions = useFanDirections();
  const links = [
    ['projects', 'Проекты'],
    ['about', 'Производство и компания'],
    ['contacts', 'Контакты'],
    ['request', 'Запрос КП и заявка'],
    ['privacy', 'Политика обработки персональных данных'],
  ];
  return (
    <footer className="ral-footer" data-field-scope="anthracite">
      <div className="ral-wrap">
        <div className="ral-footer__grid">
          <div className="ral-footer__brand">
            <p className="ral-footer__name">{company.name}</p>
            <p className="ral-footer__claim">{company.positioning}</p>
            <p className="ral-footer__concept">Концепт редизайна dvk-style.ru</p>
          </div>

          <nav aria-label="Направления в футере" className="ral-footer__fan">
            {directions.map((direction) => (
              <DirectionSwatch key={direction.id} direction={direction} size="chip" />
            ))}
          </nav>

          <nav aria-label="Компания" className="ral-footer__links">
            <ul>
              {links.map(([path, label]) => (
                <li key={path}>
                  <Link to={`/${id}/${path}`}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ral-footer__cities">
            {CITIES.map((cityId) => {
              const city = company.cities?.[cityId];
              if (!city) return null;
              return (
                <div key={cityId} className="ral-footer__city">
                  <p className="ral-footer__label">{city.label}</p>
                  {city.phones?.[0] ? (
                    <a href={`tel:${toTel(city.phones[0])}`} className="tabular">
                      {city.phones[0]}
                    </a>
                  ) : null}
                  {city.emails?.[0] ? <a href={`mailto:${city.emails[0]}`}>{city.emails[0]}</a> : null}
                </div>
              );
            })}
          </div>
        </div>
        <ModuleRule className="ral-footer__rule" />
        <div className="ral-footer__base">
          <p>
            <span className="ral-mono">RAL 7016</span> · Цвета экрана — приближение каталожных RAL.
          </p>
          <a href="https://dvk-style.ru" target="_blank" rel="noopener noreferrer">
            Действующий сайт dvk-style.ru
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="sr-only">(откроется в новой вкладке)</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
