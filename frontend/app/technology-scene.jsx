'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';

const technologies = [
  { id: 'java', name: 'Java' },
  { id: 'python', name: 'Python' },
  { id: 'spring-boot', name: 'Spring Boot' },
  { id: 'nextjs', name: 'Next.js' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'docker', name: 'Docker' },
  { id: 'linux', name: 'Linux' },
  { id: 'codex', name: 'Codex' },
  { id: 'claude', name: 'Claude' },
];

/**
 * Sorteia três pontos de passagem por ícone dentro de um raio de 34 pixels e
 * serializa os deslocamentos para as propriedades CSS usadas pelo ciclo.
 */
function createTrajectories() {
  return technologies.map(() => {
    const baseAngle = Math.random() * 2 * Math.PI;
    const properties = {
      '--duration': `${8 + Math.random() * 7}s`,
      '--delay': `-${Math.random() * 6}s`,
    };

    for (let point = 1; point <= 3; point += 1) {
      const angle = baseAngle + (point - 1) * 2 * Math.PI / 3 + Math.random() * 0.5;
      const radius = 17 + Math.random() * 17;
      properties[`--x${point}`] = `${Math.round(Math.cos(angle) * radius)}px`;
      properties[`--y${point}`] = `${Math.round(Math.sin(angle) * radius)}px`;
      properties[`--turn${point}`] = `${Math.round(Math.random() * 16 - 8)}deg`;
    }

    return properties;
  });
}

/**
 * Renderiza os ícones com posições estáveis no HTML e inicializa trajetórias na
 * montagem. A animação é pausada fora da área visível ou pelo visitante.
 */
export default function TechnologyScene() {
  const scene = useRef(null);
  const [trajectories, setTrajectories] = useState(null);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState({});
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setTrajectories(createTrajectories());
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(scene.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="technology-scene" ref={scene} data-animated={Boolean(trajectories)} data-paused={paused || !visible}>
        {technologies.map(({ id, name }, index) => (
          <div key={id} className={`technology-item technology-${id}`} style={trajectories?.[index]}>
            <motion.div
              className="motion-enter technology-entrance"
              initial={{ opacity: 0, y: 26, scale: 0.82 }}
              animate={loaded[id] ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 26, scale: 0.82 }}
              transition={{ duration: reducedMotion ? 0 : 0.75, delay: reducedMotion ? 0 : index * 0.065, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={`/technologies/${id}.png`}
                alt={name}
                width={220}
                height={220}
                loading="eager"
                unoptimized
                onLoad={() => setLoaded(current => ({ ...current, [id]: true }))}
                onError={() => setLoaded(current => ({ ...current, [id]: true }))}
              />
            </motion.div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="motion-toggle"
        aria-label={paused ? 'Retomar animação dos ícones' : 'Pausar animação dos ícones'}
        onClick={() => setPaused(value => !value)}
      >
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
          {paused
            ? <path d="M7 4.5 15 10l-8 5.5z" fill="currentColor" />
            : <path d="M7 5v10m6-10v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
        </svg>
      </button>
    </>
  );
}
