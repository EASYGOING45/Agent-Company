/**
 * 鸣潮元宇宙 - 索拉里斯大陆世界配置
 * 以地区为主视角，兼容旧 room 字段。
 */

import type { AgentState } from '../citizens/Citizen.ts';
import type { SceneConfig } from '../scene/Scene.ts';

export type RegionTheme = 'blue' | 'green' | 'warm' | 'purple';

export type RegionId = 'huanglong' | 'blackshores' | 'rinascita' | 'frontier';
export type RoomId = RegionId;

export interface RegionDefinition {
  id: RegionId;
  name: string;
  shortName: string;
  theme: RegionTheme;
  color: string;
  palette: {
    primary: string;
    secondary: string;
    glow: string;
  };
  tagline: string;
  description: string;
  highlights: string[];
  scene: SceneConfig;
  stateTargets: Record<AgentState, string[]>;
  wanderZones: string[];
}

export interface CitizenSeed {
  agentId: string;
  name: string;
  sprite: string;
  position: string;
  avatarPath: string;
  cardPath?: string;  // Card 立绘路径
  color: string;
  role: string;
  faction: string;
  region: RegionId;
}

export const WUWA_COLORS = {
  bgPrimary: '#050816',
  bgSecondary: '#0b1226',
  bgPanel: '#101a35',
  neonBlue: '#64d5ff',
  neonGold: '#f3c56b',
  neonGreen: '#87f0c7',
  neonPurple: '#9f8cff',
  neonWarm: '#ffb27a',
  shadowBlue: 'rgba(88, 198, 255, 0.28)',
  shadowGold: 'rgba(243, 197, 107, 0.24)',
  scanline: 'rgba(120, 210, 255, 0.05)',
};

export const INITIAL_CITIZENS: CitizenSeed[] = [
  {
    agentId: 'phoebe',
    name: '菲比',
    sprite: 'phoebe',
    position: 'rinascita_scholar_hall',
    color: '#f3c56b',
    role: 'owner',
    faction: '隐海修会',
    region: 'rinascita',
    avatarPath: '/assets/avatars/phoebe-avatar.png',
    cardPath: '/assets/cards/phoebe.webp',
  },
  {
    agentId: 'jinxi',
    name: '今汐',
    sprite: 'jinxi',
    position: 'huanglong_city_center',
    color: '#7fe4d6',
    role: 'sentinel',
    faction: '今州令尹府',
    region: 'huanglong',
    avatarPath: '/assets/avatars/jinxi.png',
    cardPath: '/assets/cards/jinxi.webp',
  },
  {
    agentId: 'changli',
    name: '长离',
    sprite: 'changli',
    position: 'huanglong_peach_garden',
    color: '#ff9f72',
    role: 'strategist',
    faction: '今州令尹府',
    region: 'huanglong',
    avatarPath: '/assets/avatars/changli.png',
    cardPath: '/assets/cards/changli.webp',
  },
  {
    agentId: 'jiyan',
    name: '忌炎',
    sprite: 'jiyan',
    position: 'huanglong_cloud_peak',
    color: '#87f0c7',
    role: 'marshal',
    faction: '夜归军',
    region: 'huanglong',
    avatarPath: '/assets/avatars/jiyan.png',
    cardPath: '/assets/cards/jiyan.webp',
  },
  {
    agentId: 'xiangliyao',
    name: '相里要',
    sprite: 'xiangliyao',
    position: 'frontier_ruins_gate',
    color: '#7fc2ff',
    role: 'researcher',
    faction: '稷廷遗址考察队',
    region: 'frontier',
    avatarPath: '/assets/portraits/xiangliyao.webp',
    cardPath: '/assets/cards/xiangliyao.webp',
  },
  {
    agentId: 'colletta',
    name: '珂莱塔',
    sprite: 'colletta',
    position: 'blackshores_vault',
    color: '#b79cff',
    role: 'curator',
    faction: '黑海岸',
    region: 'blackshores',
    avatarPath: '/assets/avatars/colletta.png',
    cardPath: '/assets/cards/colletta.webp',
  },
  {
    agentId: 'roccia',
    name: '洛可可',
    sprite: 'roccia',
    position: 'blackshores_garden',
    color: '#ffb4d8',
    role: 'designer',
    faction: '斐撒烈家族',
    region: 'blackshores',
    avatarPath: '/assets/avatars/roccia.png',
    cardPath: '/assets/cards/roccia.webp',
  },
  {
    agentId: 'zani',
    name: '赞妮',
    sprite: 'zani',
    position: 'rinascita_laguna_forum',
    color: '#ffd07a',
    role: 'envoy',
    faction: '斐撒烈家族',
    region: 'rinascita',
    avatarPath: '/assets/avatars/zani.png',
    cardPath: '/assets/cards/zani.webp',
  },
  {
    agentId: 'brant',
    name: '布兰特',
    sprite: 'brant',
    position: 'blackshores_tethys_core',
    color: '#72c3ff',
    role: 'captain',
    faction: '黑海岸',
    region: 'blackshores',
    avatarPath: '/assets/portraits/brant.webp',
    cardPath: '/assets/cards/brant.webp',
  },
];

export const REGION_ORDER: RegionId[] = ['huanglong', 'blackshores', 'rinascita', 'frontier'];
export const ROOM_ORDER: RoomId[] = REGION_ORDER;

export function createWorldDefinition(): Record<RegionId, RegionDefinition> {
  return {
    huanglong: {
      id: 'huanglong',
      name: '瑝珑',
      shortName: '今州',
      theme: 'green',
      color: '#87f0c7',
      palette: {
        primary: '#87f0c7',
        secondary: '#2a8572',
        glow: 'rgba(135, 240, 199, 0.28)',
      },
      tagline: '今州城风脉与乘霄山云海交汇的秩序中枢',
      description: '收纳今州城、虹镇、桃源乡与乘霄山的主大陆前线。',
      highlights: ['今州城', '虹镇', '桃源乡', '乘霄山'],
      scene: createHuanglongScene(),
      stateTargets: {
        working: ['huanglong_city_console', 'huanglong_rainbow_town', 'huanglong_cloud_peak'],
        sleeping: ['huanglong_peach_garden'],
        idle: ['huanglong_city_center', 'huanglong_city_walk_1', 'huanglong_city_walk_2'],
        thinking: ['huanglong_strategy_map', 'huanglong_city_center'],
        speaking: ['huanglong_city_center'],
        error: ['huanglong_strategy_map'],
        offline: ['huanglong_peach_garden'],
      },
      wanderZones: ['huanglong_city_walk_1', 'huanglong_city_walk_2', 'huanglong_rainbow_town', 'huanglong_city_center'],
    },
    blackshores: {
      id: 'blackshores',
      name: '黑海岸',
      shortName: '黑海岸',
      theme: 'purple',
      color: '#9f8cff',
      palette: {
        primary: '#9f8cff',
        secondary: '#4657b8',
        glow: 'rgba(159, 140, 255, 0.26)',
      },
      tagline: '泰缇斯之底的潮汐机库与金库花房共鸣',
      description: '聚合泰缇斯之底、金库与花房的高保密行动枢纽。',
      highlights: ['泰缇斯之底', '金库', '花房'],
      scene: createBlackShoresScene(),
      stateTargets: {
        working: ['blackshores_tethys_core', 'blackshores_vault', 'blackshores_command_desk'],
        sleeping: ['blackshores_garden'],
        idle: ['blackshores_center', 'blackshores_walk_1', 'blackshores_walk_2'],
        thinking: ['blackshores_data_wall', 'blackshores_center'],
        speaking: ['blackshores_center'],
        error: ['blackshores_data_wall'],
        offline: ['blackshores_garden'],
      },
      wanderZones: ['blackshores_walk_1', 'blackshores_walk_2', 'blackshores_center', 'blackshores_garden'],
    },
    rinascita: {
      id: 'rinascita',
      name: '黎那汐塔',
      shortName: '拉古那',
      theme: 'warm',
      color: '#f3c56b',
      palette: {
        primary: '#f3c56b',
        secondary: '#c98a2e',
        glow: 'rgba(243, 197, 107, 0.24)',
      },
      tagline: '拉古那城邦与隐海修会之间的金色潮声',
      description: '覆盖拉古那城邦上层议事区与隐海修会学术穹顶。',
      highlights: ['拉古那城邦', '隐海修会'],
      scene: createRinascitaScene(),
      stateTargets: {
        working: ['rinascita_scholar_hall', 'rinascita_laguna_forum', 'rinascita_archive'],
        sleeping: ['rinascita_cloister'],
        idle: ['rinascita_center', 'rinascita_walk_1', 'rinascita_walk_2'],
        thinking: ['rinascita_tide_observatory', 'rinascita_center'],
        speaking: ['rinascita_laguna_forum'],
        error: ['rinascita_archive'],
        offline: ['rinascita_cloister'],
      },
      wanderZones: ['rinascita_walk_1', 'rinascita_walk_2', 'rinascita_center', 'rinascita_laguna_forum'],
    },
    frontier: {
      id: 'frontier',
      name: '北落野',
      shortName: '北落野',
      theme: 'blue',
      color: '#64d5ff',
      palette: {
        primary: '#64d5ff',
        secondary: '#2d6fb3',
        glow: 'rgba(100, 213, 255, 0.24)',
      },
      tagline: '北落野风蚀台地与稷廷遗址裂谷遥相呼应',
      description: '以北落野营地为核心，外联稷廷遗址与边境观测节点。',
      highlights: ['北落野', '稷廷遗址'],
      scene: createFrontierScene(),
      stateTargets: {
        working: ['frontier_command_post', 'frontier_ruins_gate', 'frontier_field_lab'],
        sleeping: ['frontier_campfire'],
        idle: ['frontier_center', 'frontier_walk_1', 'frontier_walk_2'],
        thinking: ['frontier_horizon_scope', 'frontier_center'],
        speaking: ['frontier_center'],
        error: ['frontier_ruins_gate'],
        offline: ['frontier_campfire'],
      },
      wanderZones: ['frontier_walk_1', 'frontier_walk_2', 'frontier_center', 'frontier_field_lab'],
    },
  };
}

export function createDefaultScene(): SceneConfig {
  return createWorldDefinition().rinascita.scene;
}

export function inferRegionFromLocation(location: string): RegionId {
  if (location.startsWith('huanglong_')) return 'huanglong';
  if (location.startsWith('blackshores_')) return 'blackshores';
  if (location.startsWith('rinascita_')) return 'rinascita';
  return 'frontier';
}

function createBlankGrid(fill: string): string[][] {
  return Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => fill));
}

function createWalkableGrid(): boolean[][] {
  return Array.from({ length: 12 }, (_, y) =>
    Array.from({ length: 16 }, (_, x) => x > 0 && x < 15 && y > 0 && y < 11)
  );
}

function finalizeScene(
  id: string,
  theme: RegionTheme,
  floor: string[][],
  decor: string[][],
  walkable: boolean[][],
  locations: SceneConfig['locations']
): SceneConfig {
  return {
    name: id,
    tileWidth: 32,
    tileHeight: 32,
    layers: [floor, decor],
    walkable,
    locations,
    tiles: {
      floor: '/assets/tiles/floor.png',
      wall: '/assets/tiles/wall.png',
    },
    theme,
    backdrop: theme === 'green'
      ? '/assets/scenes/jinzhou.webp'
      : theme === 'purple'
        ? '/assets/scenes/black-shores.webp'
        : theme === 'warm'
          ? '/assets/scenes/laguna.webp'
          : '/assets/scenes/jinzhou.webp',
    backdropPosition: theme === 'purple' ? 'center' : 'center top',
  };
}

function outlineRoom(floor: string[][], decor: string[][], walkable: boolean[][], wallVariant: string) {
  for (let y = 0; y < 12; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      if (x === 0 || x === 15 || y === 0 || y === 11) {
        floor[y][x] = wallVariant;
        decor[y][x] = '';
        walkable[y][x] = false;
      }
    }
  }
}

function block(walkable: boolean[][], x: number, y: number, value = false) {
  if (walkable[y]?.[x] !== undefined) {
    walkable[y][x] = value;
  }
}

function createHuanglongScene(): SceneConfig {
  const floor = createBlankGrid('floor_green');
  const decor = createBlankGrid('');
  const walkable = createWalkableGrid();
  outlineRoom(floor, decor, walkable, 'wall_green');

  for (let y = 1; y < 11; y += 1) {
    for (let x = 1; x < 15; x += 1) {
      floor[y][x] = y <= 2 ? 'floor_resonance' : y >= 8 ? 'floor_plank' : x >= 10 ? 'floor_green' : x <= 4 ? 'floor_plank' : 'floor';
    }
  }

  addWindows(decor, [
    [2, 1],
    [3, 1],
    [12, 1],
    [13, 1],
  ]);
  addDecorRow(decor, walkable, 1, 10, 4, ['bookshelf', 'bookshelf', 'plant', 'papers']);

  for (const [x, y, asset] of [
    [2, 3, 'console'],
    [2, 4, 'monitor'],
    [3, 3, 'plant'],
    [5, 3, 'desk'],
    [6, 3, 'chair'],
    [7, 3, 'rug'],
    [8, 3, 'bookshelf'],
    [9, 3, 'lamp'],
    [10, 2, 'board'],
    [10, 3, 'papers'],
    [11, 3, 'shelf'],
    [12, 3, 'lamp'],
    [4, 7, 'table'],
    [5, 7, 'chair'],
    [6, 7, 'chair'],
    [7, 7, 'plant'],
    [8, 7, 'rug'],
    [11, 7, 'divider'],
    [12, 7, 'window'],
    [13, 7, 'plant'],
    [3, 9, 'couch'],
    [4, 9, 'table'],
    [5, 9, 'lamp'],
    [6, 9, 'papers'],
    [10, 9, 'bench'],
    [11, 9, 'plant'],
  ] as const) {
    decor[y][x] = asset;
    block(walkable, x, y);
  }

  const locations = {
    huanglong_city_console: { x: 2, y: 4, label: '今州中控台' },
    huanglong_city_center: { x: 8, y: 5, label: '今州城主街' },
    huanglong_strategy_map: { x: 10, y: 3, label: '虹镇调度图' },
    huanglong_rainbow_town: { x: 12, y: 5, label: '虹镇驿桥' },
    huanglong_peach_garden: { x: 2, y: 8, label: '桃源乡庭院' },
    huanglong_cloud_peak: { x: 12, y: 9, label: '乘霄山观景台' },
    huanglong_city_walk_1: { x: 6, y: 6, label: '云桥 A' },
    huanglong_city_walk_2: { x: 9, y: 8, label: '云桥 B' },
  };

  return finalizeScene('solaris-huanglong', 'green', floor, decor, walkable, locations);
}

function createBlackShoresScene(): SceneConfig {
  const floor = createBlankGrid('floor_purple');
  const decor = createBlankGrid('');
  const walkable = createWalkableGrid();
  outlineRoom(floor, decor, walkable, 'wall_purple');

  for (let y = 1; y < 11; y += 1) {
    for (let x = 1; x < 15; x += 1) {
      floor[y][x] = x >= 5 && x <= 10 ? 'floor_ring' : y >= 8 ? 'floor_plank_dark' : y <= 3 ? 'floor_grid' : 'floor_purple';
    }
  }

  addWindows(decor, [
    [2, 1],
    [13, 1],
  ]);
  addDecorRow(decor, walkable, 4, 2, 4, ['console', 'monitor', 'desk', 'chair']);
  addDecorRow(decor, walkable, 10, 2, 4, ['archive', 'bookshelf', 'plant', 'papers']);

  for (const [x, y, asset] of [
    [7, 3, 'holo'],
    [8, 3, 'lamp'],
    [9, 3, 'plant'],
    [10, 3, 'rug'],
    [11, 4, 'board'],
    [12, 4, 'divider'],
    [3, 7, 'pod'],
    [4, 8, 'pod'],
    [6, 8, 'couch'],
    [7, 8, 'table'],
    [8, 8, 'chair'],
    [9, 8, 'papers'],
    [10, 8, 'plant'],
    [12, 8, 'couch'],
    [13, 8, 'plant'],
    [11, 8, 'rug'],
  ] as const) {
    decor[y][x] = asset;
    block(walkable, x, y);
  }

  const locations = {
    blackshores_command_desk: { x: 4, y: 4, label: '黑海岸指挥席' },
    blackshores_tethys_core: { x: 8, y: 5, label: '泰缇斯之底' },
    blackshores_data_wall: { x: 11, y: 5, label: '潮汐数据墙' },
    blackshores_vault: { x: 10, y: 3, label: '金库封存区' },
    blackshores_garden: { x: 12, y: 9, label: '花房露台' },
    blackshores_center: { x: 8, y: 7, label: '潮汐甲板' },
    blackshores_walk_1: { x: 6, y: 5, label: '廊桥 A' },
    blackshores_walk_2: { x: 10, y: 8, label: '廊桥 B' },
  };

  return finalizeScene('solaris-blackshores', 'purple', floor, decor, walkable, locations);
}

function createRinascitaScene(): SceneConfig {
  const floor = createBlankGrid('floor_warm');
  const decor = createBlankGrid('');
  const walkable = createWalkableGrid();
  outlineRoom(floor, decor, walkable, 'wall_warm');

  for (let y = 1; y < 11; y += 1) {
    for (let x = 1; x < 15; x += 1) {
      floor[y][x] = y >= 7 ? 'floor_carpet' : x >= 10 ? 'floor_tile_warm' : x <= 4 ? 'floor_plank' : 'floor_warm';
    }
  }

  addWindows(decor, [
    [2, 1],
    [3, 1],
    [12, 1],
    [13, 1],
  ]);
  addDecorRow(decor, walkable, 2, 3, 4, ['bookshelf', 'desk', 'chair', 'papers']);
  addDecorRow(decor, walkable, 10, 3, 4, ['board', 'archive', 'lamp', 'plant']);

  for (const [x, y, asset] of [
    [4, 4, 'plant'],
    [5, 4, 'rug'],
    [6, 4, 'table'],
    [7, 4, 'chair'],
    [8, 4, 'chair'],
    [9, 4, 'lamp'],
    [4, 8, 'bench'],
    [5, 8, 'plant'],
    [6, 8, 'papers'],
    [8, 8, 'table'],
    [9, 8, 'chair'],
    [10, 8, 'rug'],
    [11, 8, 'window'],
    [12, 8, 'window'],
    [13, 8, 'plant'],
  ] as const) {
    decor[y][x] = asset;
    block(walkable, x, y);
  }

  const locations = {
    rinascita_scholar_hall: { x: 3, y: 4, label: '隐海修会书厅' },
    rinascita_laguna_forum: { x: 8, y: 5, label: '拉古那议事台' },
    rinascita_archive: { x: 11, y: 4, label: '潮汐档案库' },
    rinascita_tide_observatory: { x: 12, y: 7, label: '观潮台' },
    rinascita_cloister: { x: 4, y: 9, label: '回廊静室' },
    rinascita_center: { x: 8, y: 8, label: '城邦中庭' },
    rinascita_walk_1: { x: 6, y: 7, label: '拱廊 A' },
    rinascita_walk_2: { x: 10, y: 9, label: '拱廊 B' },
  };

  return finalizeScene('solaris-rinascita', 'warm', floor, decor, walkable, locations);
}

function createFrontierScene(): SceneConfig {
  const floor = createBlankGrid('floor_blue');
  const decor = createBlankGrid('');
  const walkable = createWalkableGrid();
  outlineRoom(floor, decor, walkable, 'wall');

  for (let y = 1; y < 11; y += 1) {
    for (let x = 1; x < 15; x += 1) {
      floor[y][x] = x <= 4 ? 'floor_plank_dark' : y <= 4 ? 'floor_grid' : x >= 10 ? 'floor_blue' : y >= 8 ? 'floor_plank' : 'floor';
    }
  }

  addWindows(decor, [
    [12, 1],
    [13, 1],
  ]);
  addDecorRow(decor, walkable, 2, 3, 4, ['console', 'monitor', 'desk', 'chair']);
  addDecorRow(decor, walkable, 9, 3, 4, ['board', 'pillar', 'lamp', 'papers']);

  for (const [x, y, asset] of [
    [4, 7, 'crate'],
    [5, 8, 'bar'],
    [6, 8, 'chair'],
    [7, 8, 'rug'],
    [8, 8, 'crate'],
    [10, 8, 'table'],
    [11, 8, 'chair'],
    [12, 8, 'bench'],
    [13, 8, 'plant'],
    [12, 9, 'papers'],
  ] as const) {
    decor[y][x] = asset;
    block(walkable, x, y);
  }

  const locations = {
    frontier_command_post: { x: 3, y: 4, label: '北落野前哨' },
    frontier_horizon_scope: { x: 8, y: 4, label: '地平观测镜' },
    frontier_ruins_gate: { x: 11, y: 5, label: '稷廷遗址入口' },
    frontier_field_lab: { x: 5, y: 9, label: '野外实验台' },
    frontier_campfire: { x: 12, y: 9, label: '营火区' },
    frontier_center: { x: 8, y: 7, label: '风蚀平台' },
    frontier_walk_1: { x: 6, y: 6, label: '巡逻线 A' },
    frontier_walk_2: { x: 10, y: 8, label: '巡逻线 B' },
  };

  return finalizeScene('solaris-frontier', 'blue', floor, decor, walkable, locations);
}

function addWindows(decor: string[][], cells: Array<readonly [number, number]>) {
  for (const [x, y] of cells) {
    decor[y][x] = 'window';
  }
}

function addDecorRow(
  decor: string[][],
  walkable: boolean[][],
  startX: number,
  y: number,
  count: number,
  assets: string[]
) {
  for (let i = 0; i < count; i += 1) {
    const asset = assets[i];
    if (!asset) continue;
    const x = startX + i;
    decor[y][x] = asset;
    block(walkable, x, y);
  }
}
