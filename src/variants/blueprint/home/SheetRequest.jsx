// Лист 8 «Техническое задание»: госзаказ, ТЗ к тендерам и брендирование — пунктами ТЗ; контакты двух площадок;
// справа — рабочий квиз подбора (ядро): заявка оформляется как техническое задание, подборка КП уходит с ней.
import { Mail, Phone } from 'lucide-react';
import { getCompany } from '../../../core/catalog/index.js';
import { CITIES, useCity } from '../../../core/city/index.js';
import { Quiz } from '../../../core/request/Quiz.jsx';
import { toTel } from '../../../core/ui/format.js';
import { SectionHeading } from '../ui/headings.jsx';
import { Sheet } from './Sheet.jsx';

const SERVICE_IDS = ['gov-orders', 'tender-specs', 'branding'];

export function SheetRequest() {
  const company = getCompany();
  const { city } = useCity();
  const services = SERVICE_IDS.map((id) => company.services?.find((service) => service.id === id)).filter(Boolean);
  const cities = [city, ...CITIES.filter((id) => id !== city)].map((id) => company.cities?.[id]).filter(Boolean);
  return (
    <Sheet id="request" labelledBy="bp-request-title">
      <div className="bp-wrap bp-tz">
        <div className="bp-tz__info">
          <SectionHeading
            id="bp-request-title"
            title="Техническое задание на подбор"
            lead="Опишите объект — подберём оборудование, рассчитаем проект и приедем на замер. Для госзаказчиков готовим ТЗ к тендеру."
          />
          <ol className="bp-tz__clauses">
            {services.map((service, index) => (
              <li key={service.id}>
                <span className="bp-mono bp-tz__n">{`1.${index + 1}`}</span>
                <div>
                  <h3 className="bp-tz__h font-display">{service.title}</h3>
                  <p>{service.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="bp-tz__cities">
            {cities.map((item) => (
              <div key={item.label} className="bp-tz__city">
                <p className="bp-tz__city-name font-display">{item.label}</p>
                <p className="bp-tz__addr">{item.address}</p>
                {item.phones?.[0] ? (
                  <a href={`tel:${toTel(item.phones[0])}`} className="bp-tz__line tabular">
                    <Phone className="size-4" aria-hidden="true" />
                    {item.phones[0]}
                  </a>
                ) : null}
                {item.emails?.[0] ? (
                  <a href={`mailto:${item.emails[0]}`} className="bp-tz__line">
                    <Mail className="size-4" aria-hidden="true" />
                    {item.emails[0]}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="bp-tz__form">
          <Quiz />
        </div>
      </div>
    </Sheet>
  );
}
