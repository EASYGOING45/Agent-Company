import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSceneConfig, resolveWorldAssetPath } from '../../src/world/loadWorld.ts';

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
