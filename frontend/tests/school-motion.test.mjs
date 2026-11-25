import test from 'node:test';
import assert from 'node:assert/strict';
import { pointOnSchoolPath, schoolMotionFrame, schoolStepDuration } from '../app/school-scene.mjs';

test('percurso mantém a distância proporcional ao atravessar segmentos diferentes', () => {
  const midpoint = pointOnSchoolPath([[0, 0], [3, 0], [3, 4]], .5);
  assert.equal(midpoint.x, 3);
  assert.equal(midpoint.y, .5);
});

test('requisição e resposta percorrem o mesmo corredor em sentidos opostos', () => {
  const request = { motion: 'teacher-to-office' };
  const response = { motion: 'office-to-teacher' };
  const first = schoolMotionFrame(request, 0).envelope;
  const last = schoolMotionFrame(request, 3000).envelope;
  assert.deepEqual([first.x, first.y], [780, 370]);
  assert.deepEqual([last.x, last.y], [1445, 470]);
  const reverseStart = schoolMotionFrame(response, 0).envelope;
  const reverseEnd = schoolMotionFrame(response, 3000).envelope;
  assert.deepEqual([reverseStart.x, reverseStart.y], [last.x, last.y]);
  assert.ok(Math.hypot(reverseEnd.x - first.x, reverseEnd.y - first.y) < 1e-8);
});

test('aluno entrega a prova e retorna ao posto; revisão mantém a cena estática', () => {
  const step = Object.freeze({ motion: 'exam-to-teacher' });
  assert.equal(schoolMotionFrame(step, 0).student, null);
  const delivery = schoolMotionFrame(step, 1500);
  assert.deepEqual([delivery.student.x, delivery.student.y], [615, 420]);
  assert.ok(delivery.envelope);
  assert.ok(schoolMotionFrame(step, 2500).student);
  assert.deepEqual(schoolMotionFrame(step, schoolStepDuration), { student: null, envelope: null });
  assert.deepEqual(schoolMotionFrame(step, 1500, false), { student: null, envelope: null });
});
