export const roomWidth = 880;
export const roomHeight = 440;
export const stepDuration = 3500;
const approachDuration = 1400;
const exchangeDuration = 350;
export const handoffDuration = 2 * approachDuration + exchangeDuration;

// As coordenadas percentuais correspondem ao piso da sala, na altura dos pés.
export const stations = {
  client: ['Cliente', 76, 91, 'Envio o pedido de cadastro.', 'Inicia a requisição HTTP.', 'Envia método, rota, cabeçalhos e corpo ao endpoint.'],
  controller: ['Controller', 31, 75, 'Recebo o formulário do cliente.', 'Recebe os dados do pedido.', 'Mapeia a rota HTTP para um método Java.'],
  service: ['Service', 45, 44, 'Confiro as regras do cadastro.', 'Verifica as regras do produto.', 'Valida o domínio antes de chamar a persistência.'],
  entity: ['Entity', 63.4, 64, 'Carrego os dados do produto.', 'Guarda os atributos do produto.', 'Representa o objeto que o Service cria antes de encaminhar os dados à persistência.'],
  repository: ['Repository', 82, 55, 'Peço a gravação do produto.', 'Encaminha o produto para gravar.', 'Abstrai o acesso ao armazenamento.'],
  database: ['Banco', 72, 50, 'Armazeno os registros no data center.', 'Mantém os produtos cadastrados.', 'Representa a persistência dos registros em tabela.']
};

export const seatedRoles = new Set(['service', 'entity', 'repository']);

export const people = [
  { id: 'ana-elisa', name: 'Ana Elisa', anchor: .49 },
  { id: 'andre', name: 'André', anchor: .49 },
  { id: 'bruno-raphael', name: 'Bruno Raphael', anchor: .49 },
  { id: 'carlos-vinicius', name: 'Carlos Vinícius', anchor: .49 },
  { id: 'gilberto', name: 'Gilberto', anchor: .49 },
  { id: 'julio-cesar', name: 'Júlio César', anchor: .49 },
  { id: 'luca-maia', name: 'Luca Maia', anchor: .49 },
  { id: 'maria-eduarda', name: 'Maria Eduarda', anchor: .48 },
  { id: 'pedro-fernandes', name: 'Pedro Fernandes', anchor: .47 },
  { id: 'pedro-mary', name: 'Pedro Mary', anchor: .49 }
];

const roles = Object.keys(stations);
const corridors = {
  'client:controller': [[63, 89], [55, 84], [44, 85], [36, 82]],
  'controller:service': [[38, 69], [44, 60], [46, 53]],
  'service:entity': [[48, 52], [55, 55], [58, 61]],
  'service:repository': [[48, 52], [58, 53], [67, 55], [76, 51], [79, 51]],
  'repository:database': [[78, 48]],
  'database:controller': [[65, 56], [56, 62], [48, 68], [38, 73]]
};

/** Converte posições percentuais da imagem em coordenadas do Canvas. */
function toWorld([x, y]) {
  return [x * roomWidth / 100, y * roomHeight / 100];
}

/** Resolve a âncora de chão de um papel para o sistema de coordenadas do Canvas. */
export function stationPoint(role) {
  return toWorld(stations[role].slice(1, 3));
}

export const previewCast = Object.fromEntries(roles.map((role, index) => [role, people[index]]));

/** Sorteia sem reposição e evita repetir a distribuição completa da execução anterior. */
export function drawCast(previousCast) {
  const shuffled = [...people];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (roles.every((role, index) => shuffled[index] === previousCast[role])) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return Object.fromEntries(roles.map((role, index) => [role, shuffled[index]]));
}

/** Lê o tempo virtual da etapa, preservando a posição durante pausas e trocas de velocidade. */
export function sceneTime(clock) {
  return clock.elapsed + (clock.started === null ? 0 : (performance.now() - clock.started) * clock.rate);
}

/**
 * Planeja a entrega pelos corredores livres. A Entity representa o objeto:
 * quando o fluxo sai dessa etapa, o Service é quem leva os dados ao Repository.
 */
export function planHandoff(previous, active) {
  if (!previous || previous === active) return null;
  const sender = previous === 'entity' ? 'service' : previous;
  const direct = corridors[`${sender}:${active}`];
  const reverse = corridors[`${active}:${sender}`];
  const turns = (direct || (reverse ? [...reverse].reverse() : [])).map(toWorld);
  const origin = stationPoint(sender);
  const target = stationPoint(active);
  const [lastX, lastY] = turns.at(-1) || origin;
  const dx = target[0] - lastX;
  const dy = target[1] - lastY;
  const distance = Math.hypot(dx, dy);
  const spacing = Math.min(45, distance * .87);
  const destination = [target[0] - dx / distance * spacing, target[1] - dy / distance * spacing];
  const points = [origin, ...turns, destination];
  const segments = points.slice(1).map((to, index) => {
    const from = points[index];
    return { from, to, length: Math.hypot(to[0] - from[0], to[1] - from[1]) };
  });
  return { sender, target, segments, length: segments.reduce((sum, segment) => sum + segment.length, 0) };
}

/** Interpola o percurso de ida e volta e indica o intervalo em que os dados passam de mão. */
export function handoffFrame(plan, elapsed) {
  if (!plan || elapsed >= handoffDuration) return null;
  const returning = elapsed >= approachDuration + exchangeDuration;
  const exchanging = elapsed >= approachDuration && !returning;
  const timeFromSeat = returning ? handoffDuration - elapsed : elapsed;
  const rising = seatedRoles.has(plan.sender) ? 180 : 0;
  const sitting = rising ? Math.max(0, 1 - timeFromSeat / rising) : 0;
  const walkingTime = Math.max(0, timeFromSeat - rising);
  let distance = plan.length * Math.min(walkingTime / (approachDuration - rising), 1);

  for (const [index, { from, to, length }] of plan.segments.entries()) {
    if (distance <= length || index === plan.segments.length - 1) {
      const part = Math.min(distance / length, 1);
      return {
        x: from[0] + (to[0] - from[0]) * part,
        y: from[1] + (to[1] - from[1]) * part,
        direction: sitting > 0 ? 1 : Math.sign(to[0] - from[0]) * (returning ? -1 : 1),
        stride: exchanging ? 0 : Math.sin(distance * Math.PI / 21),
        sitting,
        envelope: exchanging ? (elapsed - approachDuration) / exchangeDuration : null
      };
    }
    distance -= length;
  }
  return null;
}
