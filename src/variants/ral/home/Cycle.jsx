// Экран «Полный цикл»: закреплённая секция на антраците RAL 7016. Шаги из company.json прокрашиваются
// по очереди, пока посетитель листает: каждый шаг — полоса образца, которую «покрывают» краской слева направо.
// Телефон и reduced-motion — обычный список без закрепления.
import { useRef } from 'react';
import { motion, useMotionTemplate, useScroll, useTransform } from 'motion/react';
import { getCompany } from '../../../core/catalog/index.js';
import { useMediaQuery, usePrefersReducedMotion } from '../../../core/hooks/media.js';
import { plural } from '../../../core/ui/format.js';
import { SectionHeading } from '../ui.jsx';

const FACTS = ['izhora', 'german-machines', 'own-fleet', 'same-day-measure'];
// Шаги докрашены чуть раньше конца закреплённой сцены: последняя строка успевает побыть готовой.
const PAINT_END = 0.92;

/** Содержимое шага; копия-«краска» поверх — те же классы, но без семантики (aria-hidden). */
function StepContent({ index, step, semantic }) {
  const Title = semantic ? 'h3' : 'span';
  const Text = semantic ? 'p' : 'span';
  return (
    <>
      <span className="ral-step__num tabular" aria-hidden={semantic ? 'true' : undefined}>
        {index + 1}
      </span>
      <div className="ral-step__body">
        <Title className="ral-step__title">{step.title}</Title>
        <Text className="ral-step__text">{step.text}</Text>
      </div>
    </>
  );
}

function Step({ step, index, count, progress, pinned }) {
  const start = (index / count) * PAINT_END;
  const end = ((index + 1) / count) * PAINT_END;
  const right = useTransform(progress, [start, end], [100, 0], { clamp: true });
  const clipPath = useMotionTemplate`inset(0 ${right}% 0 0)`;
  return (
    <li className="ral-step">
      <div className="ral-step__row">
        <StepContent index={index} step={step} semantic />
      </div>
      {pinned ? (
        <motion.div className="ral-step__row ral-step__ink" aria-hidden="true" style={{ clipPath }}>
          <StepContent index={index} step={step} />
        </motion.div>
      ) : null}
    </li>
  );
}

export function Cycle() {
  const company = getCompany();
  const steps = company.cycle ?? [];
  const facts = FACTS.map((id) => company.facts?.find((fact) => fact.id === id)).filter(Boolean);
  const ref = useRef(null);
  const wide = useMediaQuery('(min-width: 1024px) and (min-height: 640px)');
  const reduce = usePrefersReducedMotion();
  const pinned = wide && !reduce;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  return (
    <section
      ref={ref}
      className="ral-cycle"
      data-field-scope="anthracite"
      data-pinned={pinned || undefined}
      style={{ '--steps': steps.length }}
      aria-labelledby="ral-cycle-title"
    >
      <div className="ral-cycle__sticky">
        <div className="ral-wrap ral-cycle__grid">
          <div className="ral-cycle__intro">
            <SectionHeading
              id="ral-cycle-title"
              title="Полный цикл под одной крышей"
              lead={`${steps.length} ${plural(steps.length, ['шаг', 'шага', 'шагов'])} от замера до монтажа — своими силами, на своём производстве.`}
            />
            <ul className="ral-cycle__facts">
              {facts.map((fact) => (
                <li key={fact.id}>{fact.text}</li>
              ))}
            </ul>
          </div>
          <ol className="ral-cycle__steps">
            {steps.map((step, index) => (
              <Step key={step.id} step={step} index={index} count={steps.length} progress={scrollYProgress} pinned={pinned} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
