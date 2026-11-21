'use client';

import { motion, useReducedMotion } from 'framer-motion';

const elements = { div: motion.div, section: motion.section, aside: motion.aside, li: motion.li };

/** Entrada discreta, disparada uma única vez ao alcançar a área visível. */
export default function MotionReveal({ children, className = '', delay = 0, as = 'div', onEntry = false, ...props }) {
  const reducedMotion = useReducedMotion();
  const Element = elements[as] || motion.div;
  const visible = { opacity: 1, y: 0 };

  return (
    <Element
      {...props}
      className={`motion-enter ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={onEntry ? visible : undefined}
      whileInView={onEntry ? undefined : visible}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: reducedMotion ? 0 : 0.65, delay: reducedMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Element>
  );
}
