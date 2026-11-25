'use client';

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { aiStepDuration, sceneTracks, trackPoint } from './ai-scenarios.mjs';
import { sceneTime } from './room-motion.mjs';

const motionPreference = '(prefers-reduced-motion: reduce)';

/** Acompanha alterações na preferência de movimento do navegador. */
function subscribeToMotionPreference(update) {
  const media = window.matchMedia(motionPreference);
  media.addEventListener('change', update);
  return () => media.removeEventListener('change', update);
}

const reduceMotion = () => window.matchMedia(motionPreference).matches;
const serverMotion = () => false;

/** Posiciona o elenco na arte e sincroniza cada trajeto com o relógio da etapa. */
export default function AiRoom({ id, scenario, cast, steps, playback }) {
  const { cursor, playing, step } = playback;
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, reduceMotion, serverMotion);
  const [frame, setFrame] = useState(null);
  const viewport = useRef(null);
  const tracks = sceneTracks(scenario, steps, cursor.index);
  const active = step?.actor;
  const focus = active ? tracks[active].at(-1)[0] : null;

  useLayoutEffect(() => {
    if (focus === null) return;
    const element = viewport.current;
    element.scrollLeft = element.scrollWidth * focus / 100 - element.clientWidth / 2;
  }, [cursor, focus]);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    let frameId;
    const animate = () => {
      setFrame({ cursor, elapsed: sceneTime(cursor.clock) });
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [playing, cursor, reducedMotion]);

  const elapsed = frame?.cursor === cursor ? frame.elapsed : 0;
  const progress = !reducedMotion && cursor.animate && (playing || frame?.cursor === cursor)
    ? Math.min(1, elapsed / (aiStepDuration(step) * .73))
    : 1;
  const positions = Object.fromEntries(Object.entries(tracks).map(([role, path]) => [
    role, trackPoint(path, progress)
  ]));

  return <>
    <p className="room-scroll-hint">Deslize para explorar toda a sala.</p>
    <div className="room-viewport" tabIndex={0} ref={viewport} role="region" aria-label={scenario.location}>
      <div className={`room ai-room ai-room-${id}`}>
        {Object.entries(scenario.roles).map(([role, station]) => {
          const person = cast[role];
          const [x, y] = positions[role];
          const isAgent = role === 'assistant';
          const walking = tracks[role].length > 1 && progress > 0 && progress < 1;
          const working = station.kitchen && role === active;
          const lift = reducedMotion ? 0 : isAgent ? 3 + Math.sin(elapsed / 230) * 3
            : walking || working ? Math.abs(Math.sin(elapsed / 92)) * 4 : 0;
          return person && (
            <div key={role} className={`ai-character${isAgent ? ' ai-agent' : ''}${station.kitchen ? ' ai-cook' : ''}`}
              data-active={active === role} style={{ left: `${x}%`, top: `${y}%`, zIndex: Math.round(y) }}>
              <span className="ai-shadow" aria-hidden="true" />
              {/* As imagens têm dimensões pequenas e são exibidas com a grade de pixels preservada. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ai-sprite" src={isAgent ? `/scenarios/ia/${person.id}.webp` : `/scenarios/people/${person.id}.webp`}
                alt="" style={{ '--lift': `${lift}px` }} />
              <span className="ai-role" title={person.name}>{isAgent ? person.name : station.label}</span>
            </div>
          );
        })}
        {active && (
          <div className="bubble ai-speech" aria-hidden="true" style={{
            left: `${Math.max(23, Math.min(77, positions[active][0]))}%`,
            bottom: `${Math.min(77, 100 - positions[active][1] + 20)}%`
          }}>{step.bubble}</div>
        )}
      </div>
    </div>
  </>;
}
