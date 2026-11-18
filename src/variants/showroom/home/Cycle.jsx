// «Полный цикл» — закреплённая секция: по латунной направляющей едет светильник, шаг под ним зажигается.
// Прогресс скролла двигает светильник (transform) и выбирает шаг; текст шага «включается» кругом света.
// Телефон и reduced-motion — без закрепления: вертикальная направляющая, шаги зажигаются по входу в окно (или горят сразу).
import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { getCompany } from '../../../core/catalog/index.js';
import { useMediaQuery, usePrefersReducedMotion } from '../../../core/hooks/media.js';
import { cn } from '../../../lib/utils.js';
import { useLitOnView } from '../light.js';
import { SectionHeading } from '../ui.jsx';

const TITLE = (
  <>
    Полный цикл: от замера до <em>монтажа</em>
  </>
);
const LEAD = 'Пять шагов у одной компании: выезд на замер, дизайн-проект, своё производство, доставка своим транспортом и монтаж.';

function StepNumber({ index, total }) {
  return (
    <span className="sr-cycle__num tabular" aria-hidden="true">
      {String(index + 1).padStart(2, '0')}
      <span>/{String(total).padStart(2, '0')}</span>
    </span>
  );
}

/** Закреплённая версия (широкий экран): направляющая с пятью остановками и сцена текущего шага. */
function PinnedCycle({ steps }) {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const runner = useTransform(scrollYProgress, (value) => `${(Math.min(1, Math.max(0, value)) * 100).toFixed(2)}%`);
  const fill = useTransform(scrollYProgress, (value) => Math.min(1, Math.max(0, value)));
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const next = Math.min(steps.length - 1, Math.max(0, Math.floor(value * steps.length)));
    setActive((current) => (current === next ? current : next));
  });
  const step = steps[active];

  return (
    <div ref={trackRef} className="sr-cycle__track" style={{ '--steps': steps.length }}>
      <div className="sr-cycle__stage">
        <div className="sr-wrap sr-cycle__layout">
          <SectionHeading id="sr-cycle-title" title={TITLE} lead={LEAD} className="sr-cycle__heading" />

          {/* Для скринридера — все шаги списком; визуальная сцена ниже скрыта от него. */}
          <ol className="sr-only">
            {steps.map((item, index) => (
              <li key={item.id}>
                Шаг {index + 1}. {item.title}. {item.text}
              </li>
            ))}
          </ol>

          <div className="sr-cycle__scene" aria-hidden="true">
            <div key={step.id} className="sr-cycle__panel">
              <StepNumber index={active} total={steps.length} />
              <p className="sr-cycle__title">{step.title}</p>
              <p className="sr-cycle__text">{step.text}</p>
            </div>
          </div>

          <div className="sr-cycle__rail" aria-hidden="true">
            <span className="sr-cycle__line" />
            <motion.span className="sr-cycle__line-fill" style={{ scaleX: fill }} />
            <motion.span className="sr-cycle__runner" style={{ x: runner }}>
              <span className="sr-cycle__lamp" />
            </motion.span>
            <ol className="sr-cycle__stops">
              {steps.map((item, index) => (
                <li key={item.id} data-state={index < active ? 'past' : index === active ? 'active' : 'future'}>
                  <span className="sr-cycle__stop" />
                  <span className="sr-cycle__stop-label">{item.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListStep({ step, index, total }) {
  const [ref, lit] = useLitOnView({ threshold: 0.6, rootMargin: '0px 0px -20% 0px' });
  return (
    <li ref={ref} className="sr-cycle__item" data-lit={lit || undefined}>
      <span className="sr-cycle__dot" aria-hidden="true" />
      <StepNumber index={index} total={total} />
      <h3 className="sr-cycle__title">
        <span className="sr-only">Шаг {index + 1}. </span>
        {step.title}
      </h3>
      <p className="sr-cycle__text">{step.text}</p>
    </li>
  );
}

/** Без закрепления: телефон, планшет, reduced-motion. */
function ListCycle({ steps }) {
  return (
    <div className="sr-wrap sr-cycle__layout sr-cycle__layout--list">
      <SectionHeading id="sr-cycle-title" title={TITLE} lead={LEAD} className="sr-cycle__heading" />
      <ol className="sr-cycle__list">
        {steps.map((step, index) => (
          <ListStep key={step.id} step={step} index={index} total={steps.length} />
        ))}
      </ol>
    </div>
  );
}

export function Cycle() {
  const steps = getCompany().cycle ?? [];
  const wide = useMediaQuery('(min-width: 1024px) and (min-height: 640px)');
  const reduce = usePrefersReducedMotion();
  const pinned = wide && !reduce;
  if (!steps.length) return null;
  return (
    <section className={cn('sr-screen sr-cycle', pinned && 'sr-cycle--pinned')} aria-labelledby="sr-cycle-title">
      {pinned ? <PinnedCycle steps={steps} /> : <ListCycle steps={steps} />}
    </section>
  );
}
