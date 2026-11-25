'use client';

import { useEffect, useRef, useState } from 'react';

/** Revela cada seção uma vez, mantendo o conteúdo disponível sem JavaScript. */
export default function ScrollReveal({ children, className = '', ...props }) {
  const section = useRef(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const element = section.current;
    if (element.getBoundingClientRect().top < window.innerHeight - 48) return;

    setPending(true);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setPending(false);
        observer.disconnect();
      }
    }, { rootMargin: '0px 0px -48px 0px', threshold: 0 });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      {...props}
      ref={section}
      className={`${className} scroll-reveal`}
      data-reveal-pending={pending}
      onFocusCapture={() => setPending(false)}
    >
      {children}
    </section>
  );
}
