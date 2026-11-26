export const relationshipScene = {
  width: 2172, height: 724,
  background: '/scenarios/school/relationships-room.webp',
  students: '/scenarios/school/relationships-students.webp',
  staff: '/scenarios/school/seated-cast.webp',
  bruno: '/scenarios/people/bruno-raphael.webp',
  seats: { 1: [283, 450, 608], 2: [997, 1166, 1327] },
  corridorY: 593,
  staffSeats: [
    { id: 'teacher', x: 450, y: 225, size: 160, column: 1 },
    { id: 'office', x: 1850, y: 265, size: 160, column: 2 },
  ],
  desks: [[229, 435, 107, 85], [396, 435, 108, 85], [556, 435, 105, 85], [943, 435, 105, 85], [1113, 435, 107, 85], [1275, 435, 106, 85], [358, 308, 178, 103], [1740, 350, 220, 130]],
  // Contornos dos computadores acima do tampo, sem apagar o tronco ao lado deles.
  staffEquipment: [
    [[381, 293], [441, 298], [455, 330], [391, 334]],
    [[1771, 334], [1835, 335], [1845, 378], [1778, 378]],
  ],
};
export const relationshipTransferDuration = 4500;
export const initialRelationshipStudents = [
  { id: 1, name: 'Bruno', classId: 1 }, { id: 2, name: 'Júlio', classId: 1 }, { id: 3, name: 'Carlos', classId: 1 },
];

export function studentSeat(studentId, classId) {
  return { x: relationshipScene.seats[classId][studentId - 1], y: 510 };
}

/** Interpola pela distância; os personagens atravessam o corredor, não as paredes. */
export function relationshipStudentFrame(student, step, elapsed, animate = true) {
  const destination = studentSeat(student.id, student.classId);
  if (!animate || step?.motion !== 'student-transfer' || step.movement?.studentId !== student.id) return { ...destination, seated: true };
  const from = studentSeat(student.id, step.movement.fromClassId);
  const to = studentSeat(student.id, step.movement.toClassId);
  const t = Math.max(0, Math.min(1, (elapsed - 200) / 3800));
  if (t === 0) return { ...from, seated: true };
  if (t === 1) return { ...to, seated: true };
  const points = [from, { x: from.x, y: relationshipScene.corridorY }, { x: to.x, y: relationshipScene.corridorY }, to];
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let distance = lengths.reduce((a, b) => a + b, 0) * t;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] ? distance / lengths[i] : 0;
      return { x: points[i].x + (points[i + 1].x - points[i].x) * f,
        y: points[i].y + (points[i + 1].y - points[i].y) * f, seated: false, flip: to.x < from.x };
    }
    distance -= lengths[i];
  }
  return { ...to, seated: true };
}
