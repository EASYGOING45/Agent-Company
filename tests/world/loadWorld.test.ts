import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSceneConfig, loadWorld, resolveWorldAssetPath } from '../../src/world/loadWorld.ts';

test('resolveWorldAssetPath prefixes relative world assets under /worlds/agent-company', () => {
  const basePath = '/worlds/agent-company';

  assert.equal(resolveWorldAssetPath(basePath, 'tiles/floor.png'), '/worlds/agent-company/tiles/floor.png');
  assert.equal(resolveWorldAssetPath(basePath, 'citizens/phoebe.png'), '/worlds/agent-company/citizens/phoebe.png');
});

test('buildSceneConfig marks non-empty tiles as walkable and preserves absolute asset paths', () => {
  const world = {
    name: 'agent-company',
    scene: {
      tileWidth: 32,
      tileHeight: 32,
      tiles: {
        floor: '/assets/tiles/floor.png',
        wall: '/assets/tiles/wall.png',
      },
      floor: [
        ['floor', 'wall', ''],
        ['', 'floor', 'floor'],
      ],
      citizens: [],
    },
  };

  const scene = buildSceneConfig('/worlds/agent-company', world);

  assert.equal(scene.tileWidth, 32);
  assert.equal(scene.tileHeight, 32);
  assert.deepEqual(scene.layers, [[['floor', 'wall', ''], ['', 'floor', 'floor']]]);
  assert.deepEqual(scene.walkable, [
    [true, true, false],
    [false, true, true],
  ]);
  assert.deepEqual(scene.locations, {});
  assert.deepEqual(scene.tiles, {
    floor: '/assets/tiles/floor.png',
    wall: '/assets/tiles/wall.png',
  });
});

test('loadWorld fetches the index and world data', async () => {
  const calls: string[] = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL) => {
    const path = String(input);
    calls.push(path);

    if (path === '/worlds/index.json') {
      return new Response(
        JSON.stringify({
          worlds: [
            {
              id: 'agent-company',
              name: 'Agent Company',
              path: '/worlds/agent-company/world.json',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (path === '/worlds/agent-company/world.json') {
      return new Response(
        JSON.stringify({
          id: 'agent-company',
          name: 'Agent Company',
          scene: {
            name: 'agent-company',
            tileWidth: 32,
            tileHeight: 32,
            tiles: {
              floor: '/assets/tiles/floor.png',
              wall: '/assets/tiles/wall.png',
            },
            floor: [
              ['', '', ''],
              ['', 'floor', ''],
              ['', '', ''],
            ],
          },
          citizens: [],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response('not found', { status: 404 });
  };

  try {
    const loaded = await loadWorld();

    assert.deepEqual(calls, ['/worlds/index.json', '/worlds/agent-company/world.json']);
    assert.equal(loaded.world.id, 'agent-company');
    assert.equal(loaded.scene.name, 'agent-company');
    assert.deepEqual(loaded.scene.walkable, [
      [false, false, false],
      [false, true, false],
      [false, false, false],
    ]);
    assert.deepEqual(loaded.scene.tiles, {
      floor: '/assets/tiles/floor.png',
      wall: '/assets/tiles/wall.png',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('loadWorld rejects unknown world ids', async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];

  globalThis.fetch = async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return new Response(
      JSON.stringify({
        worlds: [],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  };

  try {
    await assert.rejects(loadWorld('missing-world'), /Unknown world id: missing-world/);
    assert.deepEqual(calls, ['/worlds/index.json']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
