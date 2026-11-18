// Лист 3 «Полный цикл» — структурная схема: пять блоков (замер → проект → производство → доставка → монтаж),
// соединённых линией связи. На широком экране лист закреплён: скролл ведёт линию от блока к блоку (clip-path),
// текущий блок «вводится в работу» — заливка тушью, а рисунок стадии под ним вычерчивается по мере подхода линии.
// На телефоне, в низком окне (до 600 px) и с reduced-motion лист не закрепляется: всё видно сразу.
import { useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useMotionValueEvent, useScroll } from 'motion/react';
import { getCompany } from '../../../core/catalog/index.js';
import { cn } from '../../../lib/utils.js';
import { SectionHeading } from '../ui/headings.jsx';
import { CycleStage } from './CycleStage.jsx';
import { Sheet } from './Sheet.jsx';

export function SheetCycle() {
  const steps = getCompany().cycle ?? [];
  const trackRef = useRef(null);
  const lineRef = useRef(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const p = Math.min(1, Math.max(0, value));
    lineRef.current?.style.setProperty('--p', p.toFixed(4));
    const next = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
    setActive((current) => (current === next ? current : next));
  });

  if (!steps.length) return null;
  return (
    <Sheet id="cycle" labelledBy="bp-cycle-title" className="bp-cycle-sheet">
      <div ref={trackRef} className="bp-cycle" style={{ '--steps': steps.length }}>
        <div className="bp-cycle__pin">
          <div className="bp-wrap bp-cycle__inner">
            <SectionHeading
              id="bp-cycle-title"
              title="Полный цикл под одной крышей"
              lead={`Этапы 1–${steps.length}: от замера до монтажа — своими специалистами, на своём производстве, своим транспортом.`}
            />
            <div ref={lineRef} className="bp-cycle__scheme" style={{ '--p': 0 }}>
              <span className="bp-cycle__line" aria-hidden="true">
                <span className="bp-cycle__line-ink" />
              </span>
              <ol className="bp-cycle__steps">
                {steps.map((step, index) => (
                  <li key={step.id} className={cn('bp-cycle__step', index <= active && 'is-done', index === active && 'is-current')} aria-current={index === active ? 'step' : undefined} style={{ '--i': index }}>
                    <span className="bp-cycle__block">
                      <span className="bp-cycle__n bp-mono" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="bp-cycle__title font-display">
                        <span className="sr-only">Этап {index + 1}. </span>
                        {step.title}
                      </span>
                    </span>
                    <span className="bp-cycle__text">
                      {step.text}
                      {step.sourceUrl ? (
                        <a href={step.sourceUrl} target="_blank" rel="noopener noreferrer" className="bp-cycle__src">
                          dvk-style.ru
                          <ExternalLink className="size-3" aria-hidden="true" />
                          <span className="sr-only">(откроется в новой вкладке)</span>
                        </a>
                      ) : null}
                    </span>
                    <CycleStage id={step.id} index={index} />
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
