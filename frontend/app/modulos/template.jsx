'use client';

import { usePathname } from 'next/navigation';
import MotionReveal from '../motion-reveal';

/** Repete a entrada suave em cada rota de módulo ou cenário. */
export default function ModuleTemplate({ children }) {
  const pathname = usePathname();
  return (
    <>
      <noscript><style>{'.motion-enter { opacity: 1 !important; transform: none !important; }'}</style></noscript>
      <MotionReveal key={pathname} onEntry>{children}</MotionReveal>
    </>
  );
}
