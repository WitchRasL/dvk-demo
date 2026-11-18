// Переключатель города — общий для шапок вариантов: группа кнопок, выбранная нажата (aria-pressed).
// Меняет телефон, почту и адрес по всему сайту (useCity). Классы и короткие подписи задаёт вариант.
import { getCompany } from '../catalog/index.js';
import { CITIES, useCity } from '../city/index.js';

/**
 * @param {{ className?: string, buttonClassName?: string, labels?: Record<string, string>, label?: string }} props
 *   labels — короткие подписи по id города ('spb', 'msk'); без них — название площадки из company.json
 */
export function CitySwitch({ className, buttonClassName, labels, label = 'Город' }) {
  const { city, setCity } = useCity();
  const cities = getCompany().cities ?? {};
  return (
    <div role="group" aria-label={label} className={className}>
      {CITIES.filter((id) => cities[id]).map((id) => {
        const full = cities[id].label;
        const text = labels?.[id] ?? full;
        return (
          <button key={id} type="button" aria-pressed={city === id} onClick={() => setCity(id)} className={buttonClassName} title={text !== full ? full : undefined}>
            {text}
          </button>
        );
      })}
    </div>
  );
}
