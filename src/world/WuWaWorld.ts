/**
 * 鸣潮元宇宙 - 索拉里斯大陆世界配置
 * 以地区为主视角，兼容旧 room 字段。
 */

import type { AgentState } from '../citizens/Citizen.ts';
import type { SceneConfig } from '../scene/Scene.ts';
import { SCENE_TILEMAPS } from './tilemaps.ts';

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
  neonGold: '#d6b07f',
  neonGreen: '#87f0c7',
  neonPurple: '#9f8cff',
  neonWarm: '#ffb27a',
  shadowBlue: 'rgba(88, 198, 255, 0.28)',
  shadowGold: 'rgba(214, 176, 127, 0.24)',
  scanline: 'rgba(120, 210, 255, 0.05)',
};

export const INITIAL_CITIZENS: CitizenSeed[] = [
  {
    agentId: 'phoebe',
    name: '菲比',
    sprite: 'phoebe',
    position: 'rinascita_scholar_hall',
    color: '#d6b07f',
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
    avatarPath: '/assets/avatars/xiangliyao.png',
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
    avatarPath: '/assets/avatars/brant.png',
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
      color: '#d6b07f',
      palette: {
        primary: '#d6b07f',
        secondary: '#8e6f50',
        glow: 'rgba(214, 176, 127, 0.24)',
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

function finalizeScene(
  id: string,
  theme: RegionTheme,
  tilemap: typeof SCENE_TILEMAPS.huanglong
): SceneConfig {
  return {
    name: id,
    tileWidth: 32,
    tileHeight: 32,
    layers: [tilemap.floor, tilemap.decor],
    walkable: tilemap.walkable,
    locations: tilemap.locations,
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

function createHuanglongScene(): SceneConfig {
  return finalizeScene('solaris-huanglong', 'green', SCENE_TILEMAPS.huanglong);
}

function createBlackShoresScene(): SceneConfig {
  return finalizeScene('solaris-blackshores', 'purple', SCENE_TILEMAPS.blackshores);
}

function createRinascitaScene(): SceneConfig {
  return finalizeScene('solaris-rinascita', 'warm', SCENE_TILEMAPS.rinascita);
}

function createFrontierScene(): SceneConfig {
  return finalizeScene('solaris-frontier', 'blue', SCENE_TILEMAPS.frontier);
}
