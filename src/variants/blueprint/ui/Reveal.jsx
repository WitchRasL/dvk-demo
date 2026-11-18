// Появление в моушн-языке «Чертежа»: блок «вычерчивается» шторкой clip-path слева направо, как проход плоттера.
// После прохода clip-path снимается, чтобы не резать фокус и выпадающие элементы. reduced-motion — без движения.
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../../../core/hooks/media.js';

const DRAW = {
  hidden: { clipPath: 'inset(0% 100% 0% 0%)', opacity: 0.001 },
  shown: (delay) => ({
    clipPath: 'inset(0% 0% 0% 0%)',
    opacity: 1,
    transition: {
      clipPath: { duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: 0.2, delay },
    },
    transitionEnd: { clipPath: 'none' },
  }),
};

/** ({ children, as='div', delay=0, className }) */
export function Reveal({ children, as = 'div', delay = 0, className, ...rest }) {
  const reduce = usePrefersReducedMotion();
  if (reduce) {
    const Tag = as;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }
  const MotionTag = motion[as] ?? motion.div;
  return (
    <MotionTag
      className={className}
      variants={DRAW}
      custom={delay}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
