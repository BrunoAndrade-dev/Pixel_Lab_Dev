'use client';

import { useEffect, useRef, useState } from 'react';
import { sceneTime } from './room-motion.mjs';
import { schoolScene, schoolMotionFrame, schoolStepDuration } from './school-scene.mjs';
import './school-room.css';

/** Compõe as poses sentadas olhando para os computadores e anima as entregas. */
export default function SchoolRoom({ step, playback }) {
  const canvas = useRef(null);
  const viewport = useRef(null);
  const [images, setImages] = useState(null);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(true);
  const clock = playback?.cursor?.clock;
  const playing = playback?.playing || false;
  const animate = playback?.cursor?.animate !== false;

  useEffect(() => {
    let alive = true;
    Promise.all([schoolScene.background, schoolScene.sprites, '/scenarios/people/bruno-raphael.webp'].map(async src => {
      const image = new window.Image();
      image.src = src;
      await image.decode();
      return image;
    })).then(loaded => { if (alive) setImages(loaded); }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!step) return;
    const actor = schoolScene.actors.find(person => person.id === step.actor);
    if (!actor) return;
    const container = viewport.current;
    const width = canvas.current.clientWidth;
    const focus = (actor.x + actor.size / 2) / schoolScene.width * width;
    if (focus < container.scrollLeft + 60 || focus > container.scrollLeft + container.clientWidth - 60) {
      container.scrollLeft = Math.max(0, focus - container.clientWidth / 2);
    }
  }, [step]);

  useEffect(() => {
    if (!images) return;
    const ctx = canvas.current.getContext('2d');
    if (!ctx) return;
    const [background, sprites, standing] = images;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame;
    const render = () => {
      const elapsed = clock ? sceneTime(clock) : 0;
      const motion = schoolMotionFrame(step, elapsed, animate && !reduced.matches);
      const sourceWidth = sprites.naturalWidth / 3;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, schoolScene.width, schoolScene.height);
      ctx.drawImage(background, 0, 0, schoolScene.width, schoolScene.height);
      const drawActor = (actor, fraction = 1) => {
        if (actor.id === 'student' && motion.student) return;
        const bob = playing && !reduced.matches && actor.id === step?.actor && actor.id !== 'student' ? Math.sin(elapsed / 140) * 1.1 : 0;
        ctx.save();
        ctx.translate(actor.x + (actor.flipX ? actor.size : 0), actor.y + bob);
        if (actor.flipX) ctx.scale(-1, 1);
        ctx.drawImage(sprites, actor.column * sourceWidth, 0, sourceWidth, sprites.naturalHeight * fraction,
          0, 0, actor.size, actor.size * fraction);
        ctx.restore();
      };
      const actor = schoolScene.actors.find(person => person.id === step?.actor);
      if (actor) {
        ctx.beginPath();
        ctx.ellipse(actor.x + actor.size / 2, actor.y + actor.size * .95, 44, 13, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#e6a42655';
        ctx.fill();
      }
      schoolScene.actors.forEach(person => drawActor(person));
      if (motion.student) {
        const size = 205;
        const point = motion.student;
        ctx.save();
        ctx.translate(point.x, point.y - Math.abs(point.stride) * 2);
        if (point.direction < 0) ctx.scale(-1, 1);
        ctx.drawImage(standing, -size * .49, -size * .965, size, size);
        ctx.restore();
      }
      ctx.save();
      ctx.beginPath();
      for (const outline of schoolScene.foreground) {
        ctx.moveTo(...outline[0]);
        outline.slice(1).forEach(point => ctx.lineTo(...point));
        ctx.closePath();
      }
      ctx.clip();
      ctx.drawImage(background, 0, 0, schoolScene.width, schoolScene.height);
      ctx.restore();
      schoolScene.actors.forEach(person => drawActor(person, person.upperBody));
      if (motion.envelope) {
        const { x, y } = motion.envelope;
        ctx.save();
        ctx.fillStyle = '#fff6dd';
        ctx.strokeStyle = '#9e6300';
        ctx.lineWidth = 3;
        ctx.fillRect(x - 17, y - 11, 34, 22);
        ctx.strokeRect(x - 17, y - 11, 34, 22);
        ctx.beginPath();ctx.moveTo(x - 17, y - 11);ctx.lineTo(x, y + 1);ctx.lineTo(x + 17, y - 11);ctx.stroke();
        ctx.restore();
      }
      if (playing && visible && !reduced.matches && elapsed < schoolStepDuration) frame = requestAnimationFrame(render);
    };
    const refresh = () => { cancelAnimationFrame(frame); render(); };
    refresh();
    reduced.addEventListener('change', refresh);
    return () => { cancelAnimationFrame(frame); reduced.removeEventListener('change', refresh); };
  }, [images, step, clock, playing, animate, visible]);

  const speaker = schoolScene.actors.find(actor => actor.id === step?.actor);
  return (
    <>
      <p className="school-scroll-hint">Deslize para explorar os dois ambientes.</p>
      <div className="school-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Cenário da escola: sala de aula e secretaria">
        <div className="school-room">
          <canvas ref={canvas} width={schoolScene.width} height={schoolScene.height} role="img"
            aria-label="Aluno fazendo a prova, professor e responsável pela secretaria sentados de frente para seus computadores." />
          <span className="school-zone school-zone-classroom">Sala de aula</span>
          <span className="school-zone school-zone-office">Secretaria</span>
          {speaker && step.dialogue && <div className="school-dialogue" style={{ left: `${Math.min(77, (speaker.x + speaker.size / 2) / schoolScene.width * 100)}%`, top: `${Math.max(12, (speaker.y - 40) / schoolScene.height * 100)}%` }}>{step.dialogue}</div>}
        </div>
      </div>
      {error && <p role="alert">Não foi possível carregar os personagens. Recarregue a página para tentar novamente.</p>}
      <ul className="school-cast school-cast-compact" aria-label="Personagens do cenário">
        {schoolScene.actors.map(actor => <li key={actor.id} className={step?.actor === actor.id ? 'school-actor-active' : undefined}><strong>{actor.label}</strong><span>{actor.name}</span></li>)}
      </ul>
    </>
  );
}
