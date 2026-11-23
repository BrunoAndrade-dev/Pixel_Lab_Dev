/** Posições, oclusões e trajetos do CRUD escolar, independentes dos dados das notas. */
export const schoolScene = {
  width: 1774,
  height: 887,
  background: '/scenarios/school/school-room.webp',
  sprites: '/scenarios/school/seated-cast.webp',
  actors: [
    { id: 'student', label: 'Aluno', name: 'Bruno Raphael', column: 0, x: 165, y: 529, size: 230, upperBody: 0.67, description: 'Realiza a prova na carteira da sala de aula.' },
    { id: 'teacher', label: 'Professor', name: 'André', column: 1, x: 682, y: 237, size: 240, flipX: true, upperBody: 0.62, description: 'Recebe a prova e utiliza o notebook para registrar e consultar notas.' },
    { id: 'office', label: 'Secretaria', name: 'Maria Eduarda', column: 2, x: 1422, y: 305, size: 240, flipX: true, upperBody: 0.62, description: 'Representa a guarda e a organização dos registros de notas.' },
  ],
  // Mesas à frente dos personagens: coordenadas na arte original de 1774 × 887.
  foreground: [
    [[221, 652], [316, 626], [422, 650], [422, 674], [352, 705], [352, 783], [336, 780], [336, 707], [239, 687], [239, 765], [223, 761]],
    [[632, 379], [676, 347], [916, 374], [916, 491], [898, 500], [898, 410], [865, 428], [865, 505], [646, 479], [646, 407], [632, 401]],
    [[1324, 479], [1378, 429], [1653, 454], [1653, 591], [1635, 610], [1620, 531], [1590, 557], [1590, 594], [1340, 573], [1340, 499], [1324, 492]],
  ],
  // A porta central reserva a ligação entre professor e secretaria para a próxima etapa.
  passage: [[940, 600], [1100, 600], [1185, 560]],
};

export const schoolStepDuration = 3500;
const examPath = [[280, 747], [210, 730], [245, 590], [360, 540], [490, 440], [585, 425], [615, 420]];
const requestPath = [[780, 370], [875, 485], [940, 600], [1100, 600], [1185, 560], [1445, 470]];

/** Percorre uma polilinha por distância para não acelerar nos trechos longos. */
export function pointOnSchoolPath(points, progress) {
  const lengths = points.slice(1).map((point, index) => Math.hypot(point[0] - points[index][0], point[1] - points[index][1]));
  let distance = lengths.reduce((sum, length) => sum + length, 0) * Math.max(0, Math.min(1, progress));
  for (let i = 0; i < lengths.length; i += 1) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const ratio = lengths[i] ? distance / lengths[i] : 0;
      const [x, y] = points[i];
      return { x: x + (points[i + 1][0] - x) * ratio, y: y + (points[i + 1][1] - y) * ratio,
        direction: Math.sign(points[i + 1][0] - x) || 1 };
    }
    distance -= lengths[i];
  }
  return { x: points[0][0], y: points[0][1], direction: 1 };
}

/** O relógio vem da reprodução; pausar ou voltar não recalcula a simulação. */
export function schoolMotionFrame(step, elapsed, animate = true) {
  if (!step || !animate || elapsed < 0 || elapsed >= schoolStepDuration) return { student: null, envelope: null };
  if (step.motion === 'exam-to-teacher') {
    const outward = Math.max(0, Math.min(1, (elapsed - 180) / 1220));
    const returning = elapsed > 1800;
    const progress = returning ? Math.max(0, 1 - (elapsed - 1800) / 1400) : outward;
    const walking = elapsed >= 180 && elapsed < 3200;
    const point = pointOnSchoolPath(examPath, progress);
    const student = walking ? { ...point, direction: point.direction * (returning ? -1 : 1), stride: Math.sin(elapsed / 75) } : null;
    let envelope = null;
    if (elapsed >= 1400 && elapsed <= 1800) envelope = { x: 650 + (elapsed - 1400) / 400 * 130, y: 350 + (elapsed - 1400) / 400 * 20 };
    else if (student && !returning) envelope = { x: point.x + 25, y: point.y - 80 };
    return { student, envelope };
  }
  if (step.motion === 'teacher-to-office' || step.motion === 'office-to-teacher') {
    const points = step.motion === 'office-to-teacher' ? [...requestPath].reverse() : requestPath;
    return { student: null, envelope: pointOnSchoolPath(points, Math.min(1, elapsed / 3000)) };
  }
  return { student: null, envelope: null };
}
