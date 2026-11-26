import test from 'node:test';
import assert from 'node:assert/strict';
import { relationshipStudentFrame, studentSeat, relationshipScene, relationshipTransferDuration } from '../app/relationship-scene.mjs';

const movement = { motion: 'student-transfer', movement: { studentId: 3, fromClassId: 1, toClassId: 2 } };
const carlos = { id: 3, name: 'Carlos', classId: 2 };

test('transferência parte do lugar anterior e termina no destino confirmado', () => {
  assert.deepEqual(relationshipStudentFrame(carlos, movement, 0), { ...studentSeat(3, 1), seated: true });
  assert.deepEqual(relationshipStudentFrame(carlos, movement, relationshipTransferDuration), { ...studentSeat(3, 2), seated: true });
  const halfway = relationshipStudentFrame(carlos, movement, 2100);
  assert.equal(halfway.seated, false);
  assert.equal(halfway.y, relationshipScene.corridorY);
  assert.ok(halfway.x > studentSeat(3, 1).x && halfway.x < studentSeat(3, 2).x);
});

test('revisão estática e movimento reduzido mostram o destino sem repetir a caminhada', () => {
  assert.deepEqual(relationshipStudentFrame(carlos, movement, 1000, false), { ...studentSeat(3, 2), seated: true });
  const bruno = { id: 1, classId: 1 };
  assert.deepEqual(relationshipStudentFrame(bruno, movement, 2100), { ...studentSeat(1, 1), seated: true });
});

test('falhas sem etapa de movimento mantêm o aluno na turma anterior', () => {
  const previous = { ...carlos, classId: 1 };
  assert.deepEqual(relationshipStudentFrame(previous, { motion: 'idle' }, 2100), { ...studentSeat(3, 1), seated: true });
  const reverse = { motion: 'student-transfer', movement: { studentId: 3, fromClassId: 2, toClassId: 1 } };
  assert.equal(relationshipStudentFrame(previous, reverse, 2100).flip, true);
});
