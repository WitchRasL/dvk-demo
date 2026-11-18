// Экран «Выбор направления»: веер из трёх больших образцов. На широком экране колода раскрывается по скроллу
// (лопасти съезжают с общей оси и выпрямляются); на телефоне — горизонтальный scroll-snap; reduced-motion — сразу открыт.
import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { FieldLink, useFanDirections } from '../Fan.jsx';
import { useMediaQuery, usePrefersReducedMotion } from '../../../core/hooks/media.js';
import { SectionHeading } from '../ui.jsx';

function Blade({ direction, index, progress, animate }) {
  const offset = index - 1; // -1 | 0 | 1
  const rotate = useTransform(progress, [0, 1], [offset * 9, 0]);
  const x = useTransform(progress, [0, 1], [`${offset * -102}%`, '0%']);
  return (
    <motion.li className="ral-blade" data-field-scope={direction.field.id} style={animate ? { rotate, x, zIndex: 3 - Math.abs(offset) } : undefined}>
      <FieldLink direction={direction.id} to={direction.to} className="ral-blade__head">
        <span className="ral-blade__code ral-mono">{direction.field.code}</span>
        <span className="ral-blade__colour">{direction.field.name}</span>
        <span className="ral-blade__name">{direction.name}</span>
        <span className="ral-blade__summary">{direction.summary}</span>
        <span className="ral-blade__go">
          Перекрасить сайт и открыть каталог
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </FieldLink>
      <ul className="ral-blade__sections">
        {direction.sections.map((section) => (
          <li key={section.id}>
            <Link to={`${direction.to}/${section.slug}`}>
              <span>{section.name}</span>
              <span className="tabular" title="Позиций на dvk-style.ru">
                {section.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="ral-blade__total">
        {direction.totalText} на dvk-style.ru · {direction.sectionsText}
      </p>
    </motion.li>
  );
}

export function FanSection() {
  const directions = useFanDirections();
  const ref = useRef(null);
  const wide = useMediaQuery('(min-width: 1024px)');
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'start 0.15'] });
  return (
    <section ref={ref} className="ral-section ral-fan" data-field-scope="paper" aria-labelledby="ral-fan-title">
      <div className="ral-wrap ral-section__head">
        <SectionHeading
          id="ral-fan-title"
          title="Три направления — три краски веера"
          lead="Выберите образец: сайт перекрасится в цвет направления и откроет его каталог. Разделы и число позиций — как на dvk-style.ru."
        />
      </div>
      <ol className="ral-wrap ral-fan__deck">
        {directions.map((direction, index) => (
          <Blade key={direction.id} direction={direction} index={index} progress={scrollYProgress} animate={wide && !reduce} />
        ))}
      </ol>
    </section>
  );
}
