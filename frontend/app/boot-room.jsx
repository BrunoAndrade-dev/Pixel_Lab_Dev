'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { sceneTime } from './room-motion.mjs';
import { bootScene as scene, bootPositions, bootRoles, bootStepDuration, bootTableMeal } from './boot-scene.mjs';

const sources = [scene.background, scene.seated, '/scenarios/people/bruno-raphael.webp', '/scenarios/people/julio-cesar.webp', '/scenarios/people/andre.webp', '/scenarios/people/pedro-fernandes.webp', '/scenarios/people/luca-maia.webp', '/scenarios/people/maria-eduarda.webp', scene.food];

export default function BootRoom({ profile, step, playback, completedTables }) {
  const canvas = useRef(null), speech = useRef(null), viewport = useRef(null);
  const [images, setImages] = useState(null), [error, setError] = useState(false), [visible, setVisible] = useState(true);
  const actor = step?.actor || 'waiter';
  useEffect(() => {
    let alive = true;
    Promise.all(sources.map(async src => { const img = new Image(); img.src = src; await img.decode(); return img; }))
      .then(list => { if (alive) setImages(list); }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(viewport.current); return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const focus = actor === 'client' ? .46 : actor === 'waiter' && step?.motion === 'deliver' ? profile === 'simple' ? .48 : .77 : actor === 'cook' ? .61 : actor === 'storage' ? .86 : actor === 'counter' ? .33 : .52;
    const box = viewport.current;
    box.scrollLeft = Math.max(0, box.scrollWidth * focus - box.clientWidth / 2);
  }, [step, actor, profile]);

  useEffect(() => {
    if (!images) return;
    const ctx = canvas.current.getContext('2d'); if (!ctx) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame;
    const draw = () => {
      const elapsed = sceneTime(playback.cursor.clock);
      const animate = playback.cursor.animate && !reduced.matches;
      const positions = bootPositions(profile, step, elapsed, animate);
      ctx.clearRect(0, 0, scene.width, scene.height); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(images[0], 0, 0, scene.width, scene.height);
      const heads = [];
      const standing = (image, point, size, walking = false, role = null) => {
        const lift = animate && playback.playing && walking ? Math.abs(Math.sin(elapsed / 95)) * 3 : 0;
        ctx.drawImage(image, point.x - size / 2, point.y - size - lift, size, size);
        heads.push({ role, x: point.x - size * .22, y: point.y - size * .91 - lift, width: size * .44, height: size * .35 });
      };
      const seated = which => {
        const seat = scene.customerSeats[which], size = seat.size, sheet = images[1], cell = sheet.naturalWidth / 2;
        ctx.drawImage(sheet, which === 'complete' ? cell : 0, 0, cell, sheet.naturalHeight, seat.x - size / 2, seat.y, size, size);
        heads.push({ role: which === profile ? 'client' : null, x: seat.x - size * .22, y: seat.y, width: size * .44, height: size * .36 });
      };
      // O elenco está presente desde o início; o inspetor indica quando os beans são conectados.
      // Os funcionários ocupam o piso livre à frente das bancadas, com o corpo inteiro visível.
      standing(images[6], scene.stations.cook, scene.sizes.cook, false, 'cook');
      standing(images[7], scene.stations.storage, scene.sizes.storage, false, 'storage');
      standing(images[5], scene.stations.counter, scene.sizes.counter, false, 'counter');
      standing(images[4], positions.waiter, scene.sizes.waiter, step?.motion === 'to-kitchen' || step?.motion === 'deliver', 'waiter');
      for (const which of ['simple', 'complete']) {
        if (which === profile) {
          if (positions.seated) seated(which);
          else standing(images[which === 'simple' ? 2 : 3], positions.client, scene.sizes.client, step?.motion === 'arrive' || step?.motion === 'deliver', 'client');
        } else seated(which);
      }
      // Os tampos ocluem os joelhos dos clientes sentados, preservando os rostos.
      for (const outline of scene.tableFronts) {
        ctx.save(); ctx.beginPath(); outline.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); ctx.drawImage(images[0], 0, 0, scene.width, scene.height); ctx.restore();
      }
      // O lanche fica sobre o tampo, e só aparece quando a entrega chega à mesa.
      for (const which of ['simple', 'complete']) {
        const food = bootTableMeal(which, profile, step, positions.seated, completedTables);
        if (!food) continue;
        const point = scene.mealPoints[which], sheet = images[8], cell = sheet.naturalWidth / 3;
        const item = (column, row, x, y, width, height) => ctx.drawImage(sheet, column * cell, row * cell, cell, cell, x, y, width, height);
        ctx.fillStyle = '#ddc5a0'; ctx.strokeStyle = '#947247'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(point.x, point.y, 62, 17, -.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        item(food.salad ? 0 : 1, 0, point.x - 58, point.y - 45, 61, 53);
        if (food.accompaniment === 'batata frita') item(2, 0, point.x - 5, point.y - 45, 38, 49);
        item(food.drink === 'suco de laranja' ? 1 : food.drink === 'água' ? 2 : 0, 1, point.x + 27, point.y - 52, 35, 56);
      }
      const speakers = { client: positions.client, waiter: positions.waiter, ...scene.stations };
      const speaker = speakers[actor];
      if (speech.current) {
        const scale = canvas.current.clientWidth / scene.width;
        const width = speech.current.offsetWidth / scale, height = speech.current.offsetHeight / scale;
        const head = heads.find(item => item.role === actor);
        const top = (head?.y ?? speaker.y - scene.sizes[actor]) - height - 20;
        const centered = speaker.x - width / 2;
        // Escolhe o espaço livre acima do personagem sem cobrir os demais rostos.
        const candidates = [
          [centered, top], [speaker.x - width + 30, top], [speaker.x - 30, top],
          [centered, top - 110], [speaker.x - width + 30, top - 110], [speaker.x - 30, top - 110],
        ].map(([x, y], index) => {
          x = Math.max(18, Math.min(scene.width - width - 18, x));
          y = Math.max(18, Math.min(scene.height - height - 30, y));
          const overlap = heads.reduce((sum, face) => sum + Math.max(0, Math.min(x + width, face.x + face.width) - Math.max(x, face.x)) * Math.max(0, Math.min(y + height, face.y + face.height) - Math.max(y, face.y)), 0);
          return { x, y, score: overlap * 100 + index };
        }).sort((a, b) => a.score - b.score);
        const bubble = candidates[0];
        speech.current.style.setProperty('--bubble-left', `${bubble.x / scene.width * 100}%`);
        speech.current.style.setProperty('--bubble-top', `${bubble.y / scene.height * 100}%`);
        speech.current.style.setProperty('--tail-x', `${Math.max(16, Math.min(width - 16, speaker.x - bubble.x)) / width * 100}%`);
      }
      if (playback.playing && visible && !document.hidden && !reduced.matches && elapsed < bootStepDuration(step)) frame = requestAnimationFrame(draw);
    };
    const refresh = () => { cancelAnimationFrame(frame); draw(); };
    refresh(); reduced.addEventListener('change', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { cancelAnimationFrame(frame); reduced.removeEventListener('change', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [images, step, profile, completedTables, actor, playback.cursor, playback.playing, visible]);

  return <>
    <p className="relationship-scroll-hint">Duas mesas, duas aplicações de exemplo. No celular, deslize para explorar a lanchonete.</p>
    <div className="boot-viewport" tabIndex={0} ref={viewport} role="region" aria-label="Lanchonete com duas mesas de configuração e cozinha">
      <div className="boot-room">
        <canvas ref={canvas} width={scene.width} height={scene.height} role="img" aria-label="Cliente, organizador Spring e componentes da cozinha representando a inicialização da aplicação" />
        <span className="boot-table-label table-simple">Mesa 1 · API em memória</span><span className="boot-table-label table-complete">Mesa 2 · API com JPA e H2</span>
        <div ref={speech} className={`boot-speech${step?.action === 'order' ? ' is-order' : ''}`} aria-live="polite" aria-atomic="true"><strong>{bootRoles[actor]}</strong><span>{step?.dialogue || 'Escolha um combo para montar a aplicação e conferir a comanda.'}</span></div>
      </div>
    </div>
    <p className="boot-cast-note">Todos os participantes já estão na lanchonete. Os objetos da aplicação são criados e conectados ao longo das etapas; acompanhe essa evolução em Componentes.</p>
    {error && <p role="alert" className="school-message school-error">Não foi possível carregar a lanchonete. Recarregue a página.</p>}
  </>;
}
