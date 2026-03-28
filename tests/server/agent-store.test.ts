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

test('stale agents transition to sleeping then offline', () => {
  const store = new AgentStore();
  const agent = store.heartbeat({ agent: 'phoebe' });

  agent.lastSeen = 0;

  assert.equal(store.sweepOnce(30_000), true);
  assert.equal(store.get('phoebe')?.state, 'sleeping');
  assert.equal(store.get('phoebe')?.task, '休眠中...');

  assert.equal(store.sweepOnce(60_000), true);
  assert.equal(store.get('phoebe')?.state, 'offline');
  assert.equal(store.get('phoebe')?.task, null);
});
