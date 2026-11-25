import test from 'node:test';
import assert from 'node:assert/strict';
import { bootScene, bootPositions, bootStepDuration, bootPathPoint, bootTableMeal } from '../app/boot-scene.mjs';

test('cliente chega pelo corredor e só se senta na entrega', () => {
  const arrival = { action: 'order', motion: 'arrive', dialogue: 'Pedido completo' };
  assert.deepEqual(bootPositions('simple', arrival, 0).client, bootScene.entrance);
  assert.deepEqual(bootPositions('simple', arrival, bootStepDuration(arrival)).client, bootScene.counter);
  assert.equal(bootPositions('simple', { action: 'service', motion: 'idle' }, 4000).seated, false);
  for (const profile of ['simple', 'complete']) {
    const delivery = { action: 'delivery', motion: 'deliver', dialogue: 'Pronto' };
    const final = bootPositions(profile, delivery, bootStepDuration(delivery));
    assert.equal(final.seated, true);
    assert.equal(final.client.x, bootScene.customerSeats[profile].x);
    assert.equal(bootPositions(profile, delivery, 0, false).seated, true);
  }
});

test('falha não entrega o pedido nem posiciona o cliente sentado', () => {
  const failed = bootPositions('complete', { action: 'failed', motion: 'idle' }, 8000);
  assert.equal(failed.seated, false);
  assert.deepEqual(failed.client, bootScene.counter);
});

test('tempo de leitura cresce para a comanda completa e interpolação respeita distâncias', () => {
  assert.ok(bootStepDuration({ dialogue: 'pedido completo '.repeat(40) }) > bootStepDuration({ dialogue: 'Curta' }));
  assert.ok(bootStepDuration({ action: 'order', dialogue: 'Pedido curto' }) >= 16000);
  assert.ok(bootStepDuration({ action: 'receipt', dialogue: 'Registrado' }) >= 6500);
  assert.deepEqual(bootPathPoint([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 300 }], .5), { x: 100, y: 100 });
});

test('lanche só chega com a entrega, respeita escolhas e desaparece ao revisar a mesa ativa', () => {
  const food = { salad: false, accompaniment: 'sem acompanhamento', drink: 'água' };
  const delivery = { action: 'delivery', state: { order: { food } } };
  const completedTables = { simple: { startupResult: { status: 'READY' }, finalState: { order: { food } } } };
  assert.equal(bootTableMeal('simple', 'simple', delivery, false, completedTables), null);
  assert.deepEqual(bootTableMeal('simple', 'simple', delivery, true, completedTables), food);
  assert.equal(bootTableMeal('simple', 'simple', { action: 'order' }, false, completedTables), null);
  assert.equal(bootTableMeal('simple', 'simple', { action: 'failed' }, false, completedTables), null);
  assert.deepEqual(bootTableMeal('simple', 'complete', null, false, completedTables), food);
  assert.equal(bootTableMeal('complete', 'simple', null, false, completedTables), null);
});
