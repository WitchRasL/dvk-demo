// «Как мы работаем»: пять шагов полного цикла из company.json (замер → проект → производство → доставка → монтаж).
import { getCompany } from '../../catalog/index.js';
import { useVariant } from '../../variants/VariantContext.jsx';

/** @param {{ title?: string, lead?: string, steps?: { id: string, title: string, text: string }[] }} props */
export function HowWeWork({ title = 'Как мы работаем', lead, steps }) {
  const { ui } = useVariant();
  const list = steps ?? getCompany().cycle ?? [];
  if (!list.length) return null;
  return (
    <div className="how-we-work grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
      <ui.SectionHeading title={title} lead={lead} />
      <ol className="min-w-0">
        {list.map((step, index) => (
          <li key={step.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-t border-line py-5 first:border-t-0 first:pt-0 md:grid-cols-[3.5rem_minmax(0,1fr)]">
            <span className="tabular font-display text-2xl leading-none text-fg-muted md:text-3xl" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <h3 className="font-display text-xl leading-snug text-balance">
                <span className="sr-only">Шаг {index + 1}. </span>
                {step.title}
              </h3>
              {step.text ? <p className="mt-1.5 max-w-[62ch] text-base text-pretty text-fg-muted">{step.text}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
