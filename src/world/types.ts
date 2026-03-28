import type { SceneConfig } from '../scene/Scene.ts';

export interface WorldCitizenDefinition {
  id: string;
  name: string;
  sprite: string;
  x: number;
  y: number;
  avatarPath: string;
  cardPath?: string;
  color: string;
  role: string;
  faction: string;
}

export interface WorldSceneDefinition {
  name: string;
  tileWidth: number;
  tileHeight: number;
  tiles: Record<string, string>;
  floor: string[][];
}

export interface WorldDefinition {
  id: string;
  name: string;
  scene: WorldSceneDefinition;
  citizens: WorldCitizenDefinition[];
}

export interface WorldIndexEntry {
  id: string;
  name: string;
  path: string;
}

export interface WorldIndex {
  worlds: WorldIndexEntry[];
}

export interface LoadedWorld {
  world: WorldDefinition;
  scene: SceneConfig;
}
