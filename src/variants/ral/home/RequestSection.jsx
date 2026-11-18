// Экран «Заявка»: квиз подбора в рабочем виде прямо на главной (бумажный образец на поле направления)
// и контакты обеих площадок. Отправка квиза — сигнальная клавиша (кнопка варианта решает сама).
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { getCompany } from '../../../core/catalog/index.js';
import { CITIES, useCity } from '../../../core/city/index.js';
import { Quiz } from '../../../core/request/Quiz.jsx';
import { toTel } from '../../../core/ui/format.js';
import { SectionHeading } from '../ui.jsx';

function CityCard({ city, selected }) {
  return (
    <div className="ral-request__city" data-selected={selected || undefined}>
      <p className="ral-request__cityname">{city.label}</p>
      <ul>
        <li>
          <MapPin className="size-4" aria-hidden="true" />
          <span>{city.address}</span>
        </li>
        {city.phones?.slice(0, 2).map((phone) => (
          <li key={phone}>
            <Phone className="size-4" aria-hidden="true" />
            <a href={`tel:${toTel(phone)}`} className="tabular">
              {phone}
            </a>
          </li>
        ))}
        {city.emails?.[0] ? (
          <li>
            <Mail className="size-4" aria-hidden="true" />
            <a href={`mailto:${city.emails[0]}`}>{city.emails[0]}</a>
          </li>
        ) : null}
        <li>
          <Clock className="size-4" aria-hidden="true" />
          <span>Режим работы: {city.hours ?? '[уточнить]'}</span>
        </li>
      </ul>
    </div>
  );
}

export function RequestSection() {
  const company = getCompany();
  const { city: selected } = useCity();
  const measure = company.facts?.find((fact) => fact.id === 'same-day-measure')?.text;
  const ordered = [selected, ...CITIES.filter((id) => id !== selected)].filter((id) => company.cities?.[id]);
  return (
    <section className="ral-section ral-request" aria-labelledby="ral-request-title">
      <div className="ral-wrap ral-request__grid">
        <div className="ral-request__side">
          <SectionHeading id="ral-request-title" title="Подбор, замер или расчёт проекта" lead={measure ? `${measure}.` : undefined} />
          <div className="ral-request__cities">
            {ordered.map((id) => (
              <CityCard key={id} city={company.cities[id]} selected={id === selected} />
            ))}
          </div>
        </div>
        <div className="ral-request__form" data-field-scope="paper">
          <Quiz />
        </div>
      </div>
    </section>
  );
}
