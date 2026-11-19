import { people, stepDuration } from './room-motion.mjs';

export const aiModulePath = '/modulos/inteligencia-artificial';

export const aiScenarios = {
  biblioteca: {
    title: 'Consulta à documentação',
    location: 'Biblioteca',
    description: 'Acompanhe o assistente buscando evidências para responder uma pergunta de programação.',
    roles: {
      student: { label: 'Equipe NARA', point: [33, 76] },
      assistant: { label: 'Assistente de IA', point: [43, 73] }
    },
    movements: {
      'to-source': { assistant: [[65, 66], [86, 51]] },
      return: { assistant: [[65, 66], [43, 73]] }
    }
  },
  hamburgueria: {
    title: 'O efeito do prompt',
    location: 'Hamburgueria',
    description: 'Veja por que informar os detalhes muda o atendimento de dois pedidos com a mesma intenção.',
    roles: {
      vague: { label: 'Primeiro cliente', point: [24, 87] },
      detailed: { label: 'Segundo cliente', point: [57, 87] },
      assistant: { label: 'Atendente de IA', point: [48, 57] },
      grill: { label: 'Chapa', point: [59, 43], kitchen: true },
      fry: { label: 'Fritadeira', point: [71, 43], kitchen: true },
      assembly: { label: 'Montagem', point: [84, 46], kitchen: true }
    },
    movements: {
      'first-to-counter': { vague: [[32, 78], [42, 71]] },
      'first-to-table': {
        vague: [[32, 77], [23, 80]],
        assistant: [[60, 62], [79, 64], [78, 76], [48, 82], [33, 84]]
      },
      'second-to-counter': {
        detailed: [[53, 79], [42, 71]],
        assistant: [[57, 81], [77, 76], [78, 64], [48, 57]]
      },
      'second-to-table': {
        detailed: [[34, 77], [30, 86]],
        assistant: [[60, 62], [79, 64], [78, 76], [57, 83], [43, 87]]
      }
    }
  }
};

export const agents = {
  codex: 'Codex',
  'claude-code': 'Claude Code'
};

/** Distribui os papéis humanos sem reposição e registra a identidade do assistente sorteado pela API. */
export function drawAiCast(roles, agent) {
  const pool = [...people];
  return Object.fromEntries(Object.keys(roles).map(role => {
    if (role === 'assistant') return [role, agent ? { id: agent, name: agents[agent] } : null];
    const index = Math.floor(Math.random() * pool.length);
    return [role, pool.splice(index, 1)[0]];
  }));
}

/** Reserva tempo para ler falas longas e percorrer os corredores. */
export function aiStepDuration(step) {
  return Math.max(stepDuration, 1700 + (step?.bubble.length ?? 0) * 26);
}

/** Reconstrói as posições de início e fim a partir das etapas, inclusive após saltos no histórico. */
export function sceneTracks(scenario, steps, index) {
  const positions = Object.fromEntries(Object.entries(scenario.roles).map(([role, { point }]) => [role, point]));
  for (const step of steps.slice(0, index)) {
    for (const [role, path] of Object.entries(scenario.movements[step.movement] ?? {})) {
      positions[role] = path.at(-1);
    }
  }
  const movement = scenario.movements[steps[index]?.movement] ?? {};
  return Object.fromEntries(Object.entries(positions).map(([role, point]) => [role, [point, ...(movement[role] ?? [])]]));
}

/** Interpola pela distância visível de cada segmento na sala com proporção de dois para um. */
export function trackPoint(path, progress) {
  const segments = path.slice(1).map(([x, y], i) => Math.hypot((x - path[i][0]) * 2, y - path[i][1]));
  let remaining = progress * segments.reduce((sum, length) => sum + length, 0);
  for (const [i, length] of segments.entries()) {
    if (length > 0 && remaining < length) {
      return path[i].map((value, axis) => value + (path[i + 1][axis] - value) * remaining / length);
    }
    remaining -= length;
  }
  return path.at(-1);
}
