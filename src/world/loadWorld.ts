import type { SceneConfig } from '../scene/Scene.ts';
import type { LoadedWorld, WorldDefinition, WorldIndex } from './types.ts';

function isAbsoluteAssetPath(src: string) {
  return /^(\/|blob:|data:|https?:\/\/)/.test(src);
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function resolveWorldAssetPath(basePath: string, src: string) {
  if (!src) return src;
  if (isAbsoluteAssetPath(src)) return src;

  return `${basePath.replace(/\/+$/, '')}/${src.replace(/^\.?\//, '')}`;
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
  const index = await fetchJson<WorldIndex>('/worlds/index.json');
  const entry = index.worlds.find((candidate) => candidate.id === worldId);

  if (!entry) {
    throw new Error(`Unknown world id: ${worldId}`);
  }

  const world = await fetchJson<WorldDefinition>(entry.path);
  const basePath = entry.path.replace(/\/[^/]+$/, '');

  return {
    world,
    scene: buildSceneConfig(basePath, world),
  };
}
