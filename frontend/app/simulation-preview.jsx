'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { previewCast, handoffDuration } from './room-motion.mjs';

const Room = dynamic(() => import('./room'), {
  loading: () => <div className="simulation-preview-poster" />,
});

/** Teaser sem rótulos: apenas uma interação, sem executar ou expor o fluxo completo. */
export default function SimulationPreview() {
  const container = useRef(null);
  const [clock, setClock] = useState({ elapsed: 0, started: null, rate: 0.85 });
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let timer;

    const refresh = () => {
      clearInterval(timer);
      const play = visible && !document.hidden && !reducedMotion.matches;
      setPlaying(play);
      // Cada ciclo termina com os personagens nos postos, criando um loop discreto.
      setClock({ elapsed: 0, started: play ? performance.now() : null, rate: 0.85 });
      if (play) {
        timer = setInterval(() => {
          setClock({ elapsed: 0, started: performance.now(), rate: 0.85 });
        }, handoffDuration / 0.85 + 1400);
      }
    };

    let observer;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        refresh();
      });
      observer.observe(container.current);
    } else {
      visible = true;
      refresh();
    }
    document.addEventListener('visibilitychange', refresh);
    reducedMotion.addEventListener('change', refresh);
    return () => {
      clearInterval(timer);
      observer?.disconnect();
      document.removeEventListener('visibilitychange', refresh);
      reducedMotion.removeEventListener('change', refresh);
    };
  }, []);

  return (
    <div className="simulation-preview" ref={container}>
      <Room preview active="controller" previous="client" cast={previewCast} clock={clock} playing={playing} />
    </div>
  );
}
