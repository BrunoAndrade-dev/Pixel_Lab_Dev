'use client';

import { useLayoutEffect, useState } from 'react';
import { handoffDuration, sceneTime, stepDuration } from './room-motion.mjs';

/** Cria um relógio virtual para a etapa, preservando posição e velocidade durante pausas. */
function createCursor(index, animate = true) {
  return { index, animate, clock: { elapsed: 0, started: null, rate: 1 } };
}

/** Controla a sequência sem refazer a requisição nem sortear um novo elenco ao navegar. */
export default function useSimulationPlayback(steps, speed, onStepChange, durationForStep) {
  const [cursor, setCursor] = useState(() => createCursor(0));
  const [playing, setPlaying] = useState(false);
  const pos = cursor.index;
  const step = steps[pos];
  const last = pos === steps.length - 1;
  const previous = cursor.animate ? steps[pos - 1]?.actor : null;
  const duration = durationForStep
    ? durationForStep(step)
    : last ? (previous && previous !== step?.actor ? handoffDuration : 0) : stepDuration;
  const rate = Number(speed) || 1;

  useLayoutEffect(() => {
    if (!playing || !step) return;
    const clock = cursor.clock;
    clock.started = performance.now();
    clock.rate = rate;
    const timer = setTimeout(() => {
      clock.elapsed = duration;
      clock.started = null;
      if (last) {
        setPlaying(false);
        return;
      }
      setCursor(createCursor(pos + 1));
      onStepChange?.(null);
    }, Math.max(0, duration - clock.elapsed) / rate);
    return () => {
      clearTimeout(timer);
      clock.elapsed = Math.min(duration, sceneTime(clock));
      clock.started = null;
    };
  }, [playing, pos, step, last, cursor, rate, duration, onStepChange]);

  /** Posiciona o cursor em uma etapa estática para permitir inspeção. */
  function jump(index) {
    setPlaying(false);
    onStepChange?.(null);
    setCursor(createCursor(Math.min(Math.max(0, index), Math.max(0, steps.length - 1)), false));
  }

  /** Retoma o relógio ou volta ao começo se a última etapa já foi reproduzida. */
  function toggle() {
    if (!playing && last && sceneTime(cursor.clock) >= duration) setCursor(createCursor(0));
    onStepChange?.(null);
    setPlaying(!playing);
  }

  /** Reinicializa a reprodução ao carregar uma sequência. */
  function reset(autoplay = false) {
    onStepChange?.(null);
    setCursor(createCursor(0));
    setPlaying(autoplay);
  }

  return { cursor, step, last, playing, previous, jump, toggle, reset, pause: () => setPlaying(false) };
}
