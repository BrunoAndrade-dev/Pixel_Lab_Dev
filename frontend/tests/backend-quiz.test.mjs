import test from 'node:test';
import assert from 'node:assert/strict';
import { backendQuizzes, evaluateQuiz } from '../app/backend-quiz-data.mjs';
import { hasCompletedPlayback } from '../app/playback-progress.mjs';

test('cada cenário tem de 6 a 12 perguntas com resposta e orientação de estudo válidas', () => {
  assert.deepEqual(Object.keys(backendQuizzes).sort(), ['crud', 'dto', 'products', 'validation']);
  for (const questions of Object.values(backendQuizzes)) {
    assert.ok(questions.length >= 6 && questions.length <= 12);
    assert.equal(new Set(questions.map(item => item.question)).size, questions.length);
    for (const item of questions) {
      assert.equal(new Set(item.options).size, 4);
      assert.ok(item.options[item.answer]);
      for (const key of ['topic', 'study', 'explanation']) assert.ok(item[key].trim());
    }
  }
});

test('75% exatos atingem o objetivo; nota inferior não atinge', () => {
  for (const questions of Object.values(backendQuizzes)) {
    const answers = questions.map(item => item.answer);
    answers[0] = (answers[0] + 1) % 4;
    answers[1] = (answers[1] + 1) % 4;
    const passed = evaluateQuiz(questions, answers);
    assert.equal(passed.correct, 6);
    assert.equal(passed.percentage, 75);
    assert.equal(passed.passed, true);
    answers[2] = (answers[2] + 1) % 4;
    assert.equal(evaluateQuiz(questions, answers).passed, false);
  }
});

test('recomendações correspondem somente aos assuntos errados e não se repetem', () => {
  const questions = backendQuizzes.products;
  const answers = questions.map(item => item.answer);
  const perfect = evaluateQuiz(questions, answers);
  assert.equal(perfect.percentage, 100);
  assert.deepEqual(perfect.recommendations, []);
  // Controller e Repository compartilham o tema de responsabilidades das camadas.
  answers[1] = 0;
  answers[4] = 0;
  const result = evaluateQuiz(questions, answers);
  assert.equal(result.recommendations.length, 1);
  assert.equal(result.recommendations[0].topic, 'Responsabilidades das camadas');
  assert.equal(result.recommendations[0].study, questions[1].study);
});

test('respostas incompletas ou inválidas não geram uma correção', () => {
  const questions = backendQuizzes.dto;
  for (const answers of [{}, { 0: 1 }, Array(8).fill(-1), Array(8).fill(9), Array(8).fill('1')]) {
    assert.throws(() => evaluateQuiz(questions, answers), /Responda todas/);
  }
});

test('liberação exige todas as etapas concluídas, não apenas a última', () => {
  assert.equal(hasCompletedPlayback(new Set(), 0), false);
  assert.equal(hasCompletedPlayback(new Set(), 4), false);
  assert.equal(hasCompletedPlayback(new Set([3]), 4), false);
  assert.equal(hasCompletedPlayback(new Set([0, 1, 3]), 4), false);
  assert.equal(hasCompletedPlayback(new Set([0, 1, 2, 3]), 4), true);
  // Reiniciar uma execução começa com acompanhamento vazio.
  assert.equal(hasCompletedPlayback(new Set(), 4), false);
});
