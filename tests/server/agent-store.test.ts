import test from 'node:test';
import assert from 'node:assert/strict';
import { AgentStore } from '../../server/store.ts';

test('heartbeat creates an idle agent by default with room lobby', () => {
  const store = new AgentStore();

  const agent = store.heartbeat({ agent: 'phoebe' });

  assert.equal(agent.state, 'idle');
  assert.equal(agent.room, 'lobby');
  assert.equal(agent.task, null);
});

test('stale agents sleep on a first 60s sweep before going offline later', () => {
  const store = new AgentStore();
  const originalNow = Date.now;
  let now = 0;

  Date.now = () => now;

  try {
    store.heartbeat({ agent: 'phoebe' });

    now = 60_000;
    assert.equal(store.sweepOnce(), true);
    assert.equal(store.get('phoebe')?.state, 'sleeping');
    assert.equal(store.get('phoebe')?.task, '休眠中...');

    now = 90_000;
    assert.equal(store.sweepOnce(), true);
    assert.equal(store.get('phoebe')?.state, 'offline');
    assert.equal(store.get('phoebe')?.task, null);
  } finally {
    Date.now = originalNow;
  }
});
