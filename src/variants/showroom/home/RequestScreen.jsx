// «Заявка» — рабочий квиз подбора прямо на главной и контакты обеих площадок.
// В документе порядок «заголовок → квиз → площадки»: на телефоне квиз не прячется под контактами;
// на широком экране площадки встают в левую колонку под заголовок (сетка в home.css).
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { getCompany } from '../../../core/catalog/index.js';
import { CITIES, useCity } from '../../../core/city/index.js';
import { DEMO_REQUEST_ID } from '../../../core/demo/demo.js';
import { Quiz } from '../../../core/request/Quiz.jsx';
import { UNKNOWN, toTel } from '../../../core/ui/format.js';
import { SectionHeading } from '../ui.jsx';

export function RequestScreen() {
  const company = getCompany();
  const { city } = useCity();
  const cities = [city, ...CITIES.filter((other) => other !== city)].filter((cityId) => company.cities?.[cityId]);
  return (
    <section id={DEMO_REQUEST_ID} className="sr-screen sr-request" aria-labelledby="sr-request-title">
      <span className="sr-request__light" aria-hidden="true" />
      <div className="sr-wrap sr-request__layout">
        <div className="sr-request__intro">
          <SectionHeading
            id="sr-request-title"
            title={
              <>
                Включим свет на <em>вашем</em> объекте
              </>
            }
            lead="Четыре коротких шага: направление, объект, сроки, контакты. Подборка из запроса КП уйдёт вместе с заявкой."
          />
        </div>
        <div className="sr-request__form">
          <Quiz />
        </div>
        <ul className="sr-request__places">
          {cities.map((cityId) => {
            const place = company.cities[cityId];
            return (
              <li key={cityId} data-selected={cityId === city || undefined}>
                <h3>{place.label}</h3>
                <p className="sr-request__row">
                  <MapPin className="size-4" aria-hidden="true" />
                  <span>{place.address}</span>
                </p>
                {place.phones?.slice(0, 2).map((phone) => (
                  <p key={phone} className="sr-request__row">
                    <Phone className="size-4" aria-hidden="true" />
                    <a href={`tel:${toTel(phone)}`} className="tabular">
                      {phone}
                    </a>
                  </p>
                ))}
                {place.emails?.[0] ? (
                  <p className="sr-request__row">
                    <Mail className="size-4" aria-hidden="true" />
                    <a href={`mailto:${place.emails[0]}`}>{place.emails[0]}</a>
                  </p>
                ) : null}
                <p className="sr-request__row sr-request__row--muted">
                  <Clock className="size-4" aria-hidden="true" />
                  <span>Режим работы: {place.hours ?? UNKNOWN}</span>
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
