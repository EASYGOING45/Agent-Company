import { readFile } from 'node:fs/promises';
import { dirname, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SceneConfig } from '../scene/Scene.ts';
import type { LoadedWorld, WorldDefinition, WorldIndex } from './types.ts';

const WORLD_INDEX_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/worlds/index.json');
const WORLD_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/worlds');

function isAbsoluteAssetPath(src: string) {
  return /^(\/|blob:|data:|https?:\/\/)/.test(src);
}

async function readJsonFile<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as T;
}

export function resolveWorldAssetPath(basePath: string, src: string) {
  if (!src) return src;
  if (isAbsoluteAssetPath(src)) return src;

  return posix.join(basePath.replace(/\/+$/, ''), src);
}

export function buildSceneConfig(basePath: string, world: WorldDefinition): SceneConfig {
  const tiles = Object.fromEntries(
    Object.entries(world.scene.tiles).map(([key, src]) => [key, resolveWorldAssetPath(basePath, src)])
  );

  const floor = world.scene.floor;

  return {
    name: world.scene.name,
    tileWidth: world.scene.tileWidth,
    tileHeight: world.scene.tileHeight,
    layers: [floor],
    walkable: floor.map((row) => row.map((tile) => tile !== '')),
    locations: {},
    tiles,
  };
}

export async function loadWorld(worldId = 'agent-company'): Promise<LoadedWorld> {
  const index = await readJsonFile<WorldIndex>(WORLD_INDEX_PATH);
  const entry = index.worlds.find((candidate) => candidate.id === worldId);

  if (!entry) {
    throw new Error(`Unknown world id: ${worldId}`);
  }

  const worldPath = entry.path.startsWith('/worlds/')
    ? entry.path.slice('/worlds/'.length)
    : entry.path.replace(/^\/+/, '');
  const world = await readJsonFile<WorldDefinition>(resolve(WORLD_ROOT, worldPath));
  const basePath = `/${entry.path.replace(/\/[^/]+$/, '')}`;

  return {
    world,
    scene: buildSceneConfig(basePath, world),
  };
}
