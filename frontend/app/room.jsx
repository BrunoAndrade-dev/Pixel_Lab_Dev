'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  handoffDuration, handoffFrame, people, planHandoff, roomHeight, roomWidth, sceneTime, seatedRoles, stationPoint, stations
} from './room-motion.mjs';

const legBounds = {
  'ana-elisa': [.485, .60],
  'carlos-vinicius': [.484, .62],
  'luca-maia': [.484, .608],
  'pedro-fernandes': [.46, .64]
};

// Contornos da mesa e dos monitores na imagem de fundo original (1774 × 887).
const deskForeground = [
  [[1445, 512], [1583, 331], [1687, 344], [1540, 543], [1445, 531]],
  [[1497, 456], [1537, 425], [1540, 480], [1497, 510]],
  [[1552, 391], [1592, 361], [1595, 417], [1552, 447]],
  [[1606, 326], [1644, 294], [1647, 348], [1606, 377]]
];

const roundTableForeground = [
  [[1106, 551], [1122, 524], [1172, 507], [1240, 500], [1294, 500],
    [1350, 510], [1394, 528], [1419, 549], [1415, 568], [1392, 590],
    [1351, 609], [1295, 618], [1230, 616], [1174, 606], [1131, 587], [1107, 565]]
];

/** Dobra e encurta as pernas em duas partes, conservando o tronco e os pés apoiados. */
function drawSeatedPose(ctx, image, left, top, size, sitting) {
  const pixels = image.naturalWidth;
  const scale = size / pixels;
  const hip = Math.round(.65 * pixels);
  const knee = Math.round(.81 * pixels);
  const thighHeight = (knee - hip) * scale;
  const calfHeight = (pixels - knee) * scale;
  const thigh = thighHeight * (1 - .65 * sitting);
  const calf = calfHeight * (1 - .37 * sitting);
  const shoulderTop = top + thighHeight + calfHeight - thigh - calf;
  const seatTop = shoulderTop + hip * scale;
  ctx.drawImage(image, 0, 0, pixels, hip, left, shoulderTop, size, hip * scale);
  ctx.save();
  ctx.translate(left, seatTop);
  ctx.transform(1, 0, .9 * sitting, 1, 0, 0);
  ctx.drawImage(image, 0, hip, pixels, knee - hip, 0, 0, size, thigh);
  ctx.restore();
  ctx.drawImage(image, 0, knee, pixels, pixels - knee, left + .9 * sitting * thigh, seatTop + thigh, size, calf);
}

/** Simula passos alternados nas pernas sem deformar o torso, os acessórios ou os animais. */
function drawSprite(ctx, image, { person, x, y, stride, direction, sitting }) {
  const size = 99 + Math.round((y - roomHeight / 2) * .10);
  const top = -Math.round(size * .965);
  const left = -Math.round(size * person.anchor);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - Math.abs(stride) * 2));
  if (direction < 0 && person.id !== 'andre') ctx.scale(-1, 1);

  if (sitting > 0) {
    drawSeatedPose(ctx, image, left, top, size, sitting);
  } else if (!stride) {
    ctx.drawImage(image, left, top, size, size);
  } else {
    const pixels = image.naturalWidth;
    const scale = size / pixels;
    const knee = Math.round(pixels * .84);
    const start = Math.round(pixels * .35);
    const [midpoint, endPoint] = legBounds[person.id] || [.484, .64];
    const middle = Math.round(pixels * midpoint);
    const end = Math.round(pixels * endPoint);
    const remaining = pixels - knee;
    const bottom = top + knee * scale;
    ctx.drawImage(image, 0, 0, pixels, knee, left, top, size, knee * scale);
    ctx.drawImage(image, 0, knee, start, remaining, left, bottom, start * scale, remaining * scale);
    ctx.drawImage(image, end, knee, pixels - end, remaining, left + end * scale, bottom, (pixels - end) * scale, remaining * scale);

    for (const [edge, next, swing] of [[start, middle, stride], [middle, end, -stride]]) {
      const columnWidth = next - edge;
      ctx.save();
      ctx.translate(left + edge * scale, bottom);
      ctx.transform(1, 0, swing * .26, 1 - Math.max(0, swing) * .16, 0, 0);
      ctx.drawImage(image, edge, knee, columnWidth, remaining, 0, 0, columnWidth * scale, remaining * scale);
      ctx.restore();
    }
  }
  ctx.restore();
}

/** Recompõe o mobiliário que fica à frente dos personagens no plano da sala. */
function drawForeground(ctx, background, outlines) {
  ctx.save();
  ctx.scale(roomWidth / background.naturalWidth, roomHeight / background.naturalHeight);
  ctx.beginPath();
  for (const outline of outlines) {
    ctx.moveTo(...outline[0]);
    for (const point of outline.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
  }
  ctx.clip();
  ctx.drawImage(background, 0, 0);
  ctx.restore();
}

/** Desenha um envelope durante a entrega, interpolado entre os dois atores. */
function drawEnvelope(ctx, motion, target, receiverSeated) {
  const ratio = motion.envelope;
  const x = Math.round(motion.x + (target[0] - motion.x) * ratio);
  const y = Math.round(motion.y + (target[1] - motion.y) * ratio - 42 +
    (receiverSeated ? 14 * ratio : 0) - Math.sin(ratio * Math.PI) * 12);
  ctx.fillStyle = '#67461c';
  ctx.fillRect(x - 12, y - 8, 24, 16);
  ctx.fillStyle = '#ffd579';
  ctx.fillRect(x - 10, y - 6, 20, 12);
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 5);
  ctx.lineTo(x, y + 1);
  ctx.lineTo(x + 9, y - 5);
  ctx.strokeStyle = '#956527';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** Compõe os sprites sobre o fundo, desenhando os personagens mais próximos por último. */
function drawRoom(ctx, actors, images, active, handoff, elapsed) {
  ctx.clearRect(0, 0, roomWidth, roomHeight);
  ctx.imageSmoothingEnabled = false;
  const motion = handoffFrame(handoff, elapsed);
  const positions = actors.map(actor => motion && actor.role === handoff.sender
    ? { ...actor, ...motion }
    : actor).sort((a, b) => a.y - b.y);

  for (const actor of positions) {
    const { role, x, y } = actor;
    ctx.beginPath();
    ctx.ellipse(x, y, role === active ? 23 : 14, role === active ? 8 : 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = role === active ? '#f0b43f' : '#42342430';
    ctx.fill();
  }

  if (images.racks) {
    // Os gabinetes ficam sob o quadro e ao lado da estação do Banco.
    ctx.drawImage(images.racks, 531, 151, 72, 74);
  }

  for (const actor of positions) {
    const image = images[actor.person.id];
    if (image) drawSprite(ctx, image, actor);
    if (actor.role === 'entity') {
      if (images.background) drawForeground(ctx, images.background, roundTableForeground);
      if (images.laptop) {
        const width = 42;
        const height = Math.round(width * images.laptop.naturalHeight / images.laptop.naturalWidth);
        ctx.drawImage(images.laptop, 572, 282 - height, width, height);
      }
    }
  }
  if (images.background) drawForeground(ctx, images.background, deskForeground);

  if (motion?.envelope != null) drawEnvelope(ctx, motion, handoff.target, seatedRoles.has(active));
}

/** Exibe o elenco e mantém a animação e a inspeção sincronizadas com a etapa atual. */
export default function Room({ active, playing, onInspect, bubble, previous, cast, clock, preview = false }) {
  const canvas = useRef(null);
  const viewport = useRef(null);
  const [images, setImages] = useState({});
  const actors = useMemo(() => Object.entries(cast).map(([role, person]) => {
    const [x, y] = stationPoint(role);
    return { role, person, x, y, stride: 0, direction: 1, sitting: seatedRoles.has(role) ? 1 : 0 };
  }), [cast]);
  const handoff = useMemo(() => planHandoff(previous, active), [previous, active]);
  const [, x, y] = stations[active];

  useEffect(() => {
    let mounted = true;
    const sources = [
      ...people.map(({ id }) => [id, `/scenarios/people/${id}.webp`]),
      ['racks', '/scenarios/data-center.webp'],
      ['laptop', '/scenarios/round-table-laptop.webp'],
      ['background', '/scenarios/nara-lab-room.png']
    ];
    Promise.all(sources.map(async ([id, src]) => {
      const image = new Image();
      image.src = src;
      try {
        await image.decode();
        return [id, image];
      } catch {
        return [id, null];
      }
    })).then(entries => {
      if (mounted) setImages(Object.fromEntries(entries));
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (preview) return;
    const container = viewport.current;
    const sceneWidth = canvas.current.clientWidth;
    const margin = Math.min(80, container.clientWidth / 4);
    const target = x * sceneWidth / 100;
    if (target < container.scrollLeft + margin || target > container.scrollLeft + container.clientWidth - margin) {
      container.scrollLeft = target - container.clientWidth / 2;
    }
  }, [x, preview]);

  useEffect(() => {
    const ctx = canvas.current.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame;

    const render = () => {
      const elapsed = sceneTime(clock);
      drawRoom(ctx, actors, images, active, reduced.matches ? null : handoff, elapsed);
      if (playing && !reduced.matches && handoff && elapsed < handoffDuration) {
        frame = requestAnimationFrame(render);
      }
    };

    const refresh = () => {
      cancelAnimationFrame(frame);
      render();
    };

    refresh();
    reduced.addEventListener('change', refresh);
    return () => {
      cancelAnimationFrame(frame);
      reduced.removeEventListener('change', refresh);
    };
  }, [active, actors, clock, handoff, images, playing]);

  return (
    <>
      {!preview && <p className="room-scroll-hint">Deslize para explorar toda a sala.</p>}
      <div className="room-viewport" ref={viewport} tabIndex={preview ? undefined : 0} role={preview ? 'img' : 'region'} aria-label={preview ? 'Prévia de personagens interagindo em uma sala de simulação 2D' : 'Mapa da sala de simulação'}>
        <div className="room">
          <canvas width={roomWidth} height={roomHeight} ref={canvas} aria-hidden="true" />
          {!preview && Object.entries(stations).map(([id, [title, left, top]]) => (
            <button
              type="button"
              key={id}
              className={`station${active === id ? ' selected' : ''}`}
              aria-pressed={active === id}
              title={cast[id].name}
              data-character={cast[id].id}
              onClick={() => onInspect(id)}
              style={{ left: `${id === 'entity' ? 58 : left}%`, top: `${top}%` }}
            >
              {title}
            </button>
          ))}
          {!preview && bubble && (
            <div className="bubble" style={{ left: `${Math.min(x, 78)}%`, bottom: `${100 - y + (seatedRoles.has(active) ? 18 : 24)}%` }}>
              {bubble}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
