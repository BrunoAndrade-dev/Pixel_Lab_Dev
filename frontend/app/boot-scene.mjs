export const bootScene = {
  width: 1774, height: 887,
  background: '/scenarios/boot/lanchonete.webp',
  seated: '/scenarios/boot/clientes-sentados.webp',
  food: '/scenarios/boot/lanches.webp',
  counter: { x: 800, y: 602 },
  entrance: { x: 1450, y: 770 },
  waiter: { x: 920, y: 594 },
  kitchen: { x: 1450, y: 490 },
  sizes: { client: 205, waiter: 205, counter: 205, cook: 205, storage: 205 },
  stations: { counter: { x: 590, y: 590 }, cook: { x: 1080, y: 590 }, storage: { x: 1550, y: 565 } },
  customerSeats: { simple: { x: 635, y: 550, size: 210 }, complete: { x: 1150, y: 570, size: 220 } },
  mealPoints: { simple: { x: 715, y: 644 }, complete: { x: 1231, y: 670 } },
  tableFronts: [
    [[622, 617], [706, 599], [779, 617], [773, 652], [704, 674], [626, 657]],
    [[1136, 649], [1216, 622], [1296, 645], [1292, 675], [1215, 699], [1139, 677]],
  ],
};

export const bootRoles = { client: 'Cliente · desenvolvedor', waiter: 'Spring · organizador', counter: 'Atendente · Controller', cook: 'Cozinheiro · Service', storage: 'Armazenamento · Repository' };

export function bootStepDuration(step) {
  // Cerca de 135 palavras/minuto, com tempo adicional para interpretar a comanda.
  const words = (step?.dialogue || '').trim().split(/\s+/).filter(Boolean).length;
  const reading = 3500 + words * 450;
  return Math.max(step?.action === 'order' ? 16000 : 6500, reading);
}

/** Apenas a entrega desta etapa serve o lanche; revisar etapas anteriores limpa a mesa ativa. */
export function bootTableMeal(which, activeProfile, step, seated, completedTables) {
  if (which === activeProfile) return step?.action === 'delivery' && seated ? step.state.order.food : null;
  const completed = completedTables[which];
  return completed?.startupResult.status === 'READY' ? completed.finalState.order.food : null;
}

/** Distância real dos segmentos: os personagens permanecem nos corredores. */
export function bootPathPoint(path, progress) {
  const lengths = path.slice(1).map((point, i) => Math.hypot(point.x - path[i].x, point.y - path[i].y));
  let distance = Math.max(0, Math.min(1, progress)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const fraction = lengths[i] ? distance / lengths[i] : 0;
      return { x: path[i].x + (path[i + 1].x - path[i].x) * fraction, y: path[i].y + (path[i + 1].y - path[i].y) * fraction };
    }
    distance -= lengths[i];
  }
  return path.at(-1);
}

export function bootPositions(profile, step, elapsed, animate = true) {
  const progress = animate ? Math.min(1, elapsed / (bootStepDuration(step) * .75)) : 1;
  const seat = bootScene.customerSeats[profile];
  const customerEnd = { x: seat.x, y: seat.y + seat.size };
  let client = bootScene.counter, waiter = bootScene.waiter, seated = false;
  if (!step) client = bootScene.entrance;
  else if (step.motion === 'arrive') client = bootPathPoint([bootScene.entrance, { x: 1450, y: 582 }, { x: 800, y: 582 }, bootScene.counter], progress);
  else if (step.motion === 'deliver') {
    client = bootPathPoint([bootScene.counter, { x: seat.x, y: 575 }, customerEnd], progress);
    waiter = bootPathPoint([bootScene.kitchen, { x: 1430, y: 582 }, { x: seat.x + 250, y: 582 }, { x: seat.x + 250, y: seat.y + 180 }], progress);
    seated = progress === 1;
  }
  if (step?.motion === 'to-kitchen') waiter = bootPathPoint([bootScene.waiter, { x: 1430, y: 582 }, bootScene.kitchen], progress);
  else if (step && !['order', 'receipt', 'delivery'].includes(step.action)) waiter = bootScene.kitchen;
  return { client, waiter, seated, progress };
}
