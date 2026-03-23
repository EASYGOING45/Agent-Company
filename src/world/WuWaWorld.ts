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
    avatarPath: '/assets/avatars/xiangliyao.png',
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
    avatarPath: '/assets/avatars/brant.png',
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
      floor[y][x] = y <= 3 ? 'floor_resonance' : x >= 10 ? 'floor_green' : 'floor';
    }
  }

  for (const [x, y, asset] of [
    [3, 3, 'console'],
    [6, 3, 'desk'],
    [10, 2, 'board'],
    [12, 7, 'window'],
    [4, 8, 'table'],
  ] as const) {
    decor[y][x] = asset;
    block(walkable, x, y);
  }

  const locations = {
    huanglong_city_console: { x: 3, y: 4, label: '今州中控台' },
    huanglong_city_center: { x: 8, y: 5, label: '今州城主街' },
    huanglong_strategy_map: { x: 10, y: 3, label: '虹镇调度图' },
    huanglong_rainbow_town: { x: 12, y: 5, label: '虹镇驿桥' },
    huanglong_peach_garden: { x: 4, y: 9, label: '桃源乡庭院' },
    huanglong_cloud_peak: { x: 12, y: 9, label: '乘霄山观景台' },
    huanglong_city_walk_1: { x: 6, y: 7, label: '云桥 A' },
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
      floor[y][x] = x >= 5 && x <= 10 ? 'floor_ring' : 'floor_purple';
    }
  }

  for (const [x, y, asset] of [
    [3, 3, 'console'],
    [8, 3, 'holo'],
    [11, 4, 'board'],
    [4, 8, 'pod'],
    [12, 8, 'couch'],
  ] as const) {
    decor[y][x] = asset;
    block(walkable, x, y);
  }

  const locations = {
    blackshores_command_desk: { x: 3, y: 4, label: '黑海岸指挥席' },
    blackshores_tethys_core: { x: 8, y: 5, label: '泰缇斯之底' },
    blackshores_data_wall: { x: 11, y: 5, label: '潮汐数据墙' },
    blackshores_vault: { x: 5, y: 9, label: '金库封存区' },
    blackshores_garden: { x: 12, y: 9, label: '花房露台' },
    blackshores_center: { x: 8, y: 7, label: '潮汐甲板' },
    blackshores_walk_1: { x: 6, y: 3, label: '廊桥 A' },
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
      floor[y][x] = y >= 7 ? 'floor_carpet' : 'floor_warm';
    }
  }

  for (const [x, y, asset] of [
    [3, 3, 'desk'],
    [7, 3, 'table'],
    [11, 3, 'board'],
    [4, 8, 'bench'],
    [12, 8, 'window'],
  ] as const) {
    decor[y][x] = asset;
    block(walkable, x, y);
  }

  const locations = {
    rinascita_scholar_hall: { x: 3, y: 4, label: '隐海修会书厅' },
    rinascita_laguna_forum: { x: 8, y: 5, label: '拉古那议事台' },
    rinascita_archive: { x: 11, y: 4, label: '潮汐档案库' },
    rinascita_tide_observatory: { x: 12, y: 8, label: '观潮台' },
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
      floor[y][x] = x <= 4 ? 'floor' : y <= 4 ? 'floor_grid' : 'floor_blue';
    }
  }

  for (const [x, y, asset] of [
    [3, 3, 'console'],
    [8, 3, 'board'],
    [11, 4, 'pillar'],
    [5, 8, 'bar'],
    [12, 8, 'bench'],
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
