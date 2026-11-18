// Главное действие внизу страницы: заявка на подбор + телефон выбранного города (R14, R14.1).
import { Phone } from 'lucide-react';
import { getCompany } from '../../catalog/index.js';
import { useCity } from '../../city/index.js';
import { toTel } from '../../ui/format.js';
import { Container } from '../../ui/layout.jsx';
import { useVariant } from '../../variants/VariantContext.jsx';
import { cn } from '../../../lib/utils.js';

/** @param {{ title?: string, lead?: string, className?: string }} props */
export function RequestCta({ title = 'Нужен подбор, замер или расчёт проекта?', lead, className }) {
  const { id, ui } = useVariant();
  const { contacts } = useCity();
  const phone = contacts?.phones?.[0];
  return (
    <section aria-labelledby="request-cta-title" className={cn('request-cta mt-12 border-t border-line bg-surface py-12 md:mt-20 md:py-16', className)}>
      <Container className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-10">
        <div>
          <h2 id="request-cta-title" className="max-w-2xl font-display text-2xl leading-tight text-balance md:text-3xl">
            {title}
          </h2>
          <p className="mt-3 max-w-[60ch] text-base text-pretty text-fg-muted md:text-lg">{lead ?? getCompany().promise}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ui.Button to={`/${id}/request`}>Заявка на подбор</ui.Button>
          {phone ? (
            <ui.Button variant="secondary" href={`tel:${toTel(phone)}`}>
              <Phone className="size-4" aria-hidden="true" />
              <span className="tabular">{phone}</span>
              <span className="sr-only">, {contacts.label}</span>
            </ui.Button>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
