/**
 * 鸣潮元宇宙 - 世界配置
 * 隐海修会基地四房间布局
 */

import type { AgentState } from '../citizens/Citizen.ts';
import type { SceneConfig } from '../scene/Scene.ts';

export type RoomId = 'lobby' | 'meeting' | 'lounge' | 'training';

export interface RoomDefinition {
  id: RoomId;
  name: string;
  theme: 'blue' | 'green' | 'warm' | 'purple';
  color: string;
  tagline: string;
  description: string;
  scene: SceneConfig;
  stateTargets: Record<AgentState, string[]>;
  wanderZones: string[];
}

export interface CitizenSeed {
  agentId: string;
  name: string;
  sprite: string;
  position: string;
  color: string;
  role: string;
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
  { agentId: 'phoebe', name: '菲比', sprite: 'phoebe', position: 'lobby_center', color: WUWA_COLORS.neonGold, role: 'owner' },
  { agentId: 'claude', name: 'Claude', sprite: 'claude', position: 'lobby_desk_1', color: WUWA_COLORS.neonBlue, role: 'member' },
  { agentId: 'gemini', name: 'Gemini', sprite: 'gemini', position: 'meeting_console_2', color: WUWA_COLORS.neonGreen, role: 'member' },
  { agentId: 'codex', name: 'Codex', sprite: 'codex', position: 'training_ring_south', color: WUWA_COLORS.neonPurple, role: 'member' },
];

export const ROOM_ORDER: RoomId[] = ['lobby', 'meeting', 'lounge', 'training'];

export function createWorldDefinition(): Record<RoomId, RoomDefinition> {
  return {
    lobby: {
      id: 'lobby',
      name: '主厅',
      theme: 'blue',
      color: WUWA_COLORS.neonBlue,
      tagline: '潮声前台，接收今日回响',
      description: '任务分流与动态总览中心。',
      scene: createLobbyScene(),
      stateTargets: {
        working: ['lobby_desk_1', 'lobby_desk_2', 'lobby_desk_3'],
        sleeping: ['lobby_window_bench'],
        idle: ['lobby_center', 'lobby_walk_1', 'lobby_walk_2'],
        thinking: ['lobby_map', 'lobby_center'],
        speaking: ['lobby_center'],
        error: ['lobby_map'],
        offline: ['lobby_window_bench'],
      },
      wanderZones: ['lobby_center', 'lobby_walk_1', 'lobby_walk_2', 'lobby_walk_3'],
    },
    meeting: {
      id: 'meeting',
      name: '共鸣室',
      theme: 'green',
      color: WUWA_COLORS.neonGreen,
      tagline: '作战推演与共鸣校准',
      description: '讨论与校准同步在此进行。',
      scene: createMeetingScene(),
      stateTargets: {
        working: ['meeting_console_1', 'meeting_console_2', 'meeting_console_3'],
        sleeping: ['meeting_recliner'],
        idle: ['meeting_center', 'meeting_walk_1', 'meeting_walk_2'],
        thinking: ['meeting_board', 'meeting_center'],
        speaking: ['meeting_center'],
        error: ['meeting_board'],
        offline: ['meeting_recliner'],
      },
      wanderZones: ['meeting_center', 'meeting_walk_1', 'meeting_walk_2', 'meeting_walk_3'],
    },
    lounge: {
      id: 'lounge',
      name: '休息室',
      theme: 'warm',
      color: WUWA_COLORS.neonWarm,
      tagline: '把灵感沉到温热灯下',
      description: '恢复、闲聊和短暂停靠区域。',
      scene: createLoungeScene(),
      stateTargets: {
        working: ['lounge_reading_table', 'lounge_bar'],
        sleeping: ['lounge_couch_1', 'lounge_couch_2', 'lounge_daybed'],
        idle: ['lounge_center', 'lounge_walk_1', 'lounge_walk_2'],
        thinking: ['lounge_window', 'lounge_center'],
        speaking: ['lounge_center'],
        error: ['lounge_window'],
        offline: ['lounge_daybed'],
      },
      wanderZones: ['lounge_center', 'lounge_walk_1', 'lounge_walk_2', 'lounge_walk_3'],
    },
    training: {
      id: 'training',
      name: '训练场',
      theme: 'purple',
      color: WUWA_COLORS.neonPurple,
      tagline: '高频实验，释放压力',
      description: '训练回路与实验装置集中在此。',
      scene: createTrainingScene(),
      stateTargets: {
        working: ['training_console', 'training_ring_north', 'training_ring_south'],
        sleeping: ['training_pod'],
        idle: ['training_center', 'training_walk_1', 'training_walk_2'],
        thinking: ['training_holo', 'training_center'],
        speaking: ['training_center'],
        error: ['training_holo'],
        offline: ['training_pod'],
      },
      wanderZones: ['training_center', 'training_walk_1', 'training_walk_2', 'training_walk_3'],
    },
  };
}

export function createDefaultScene(): SceneConfig {
  return createWorldDefinition().lobby.scene;
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
  theme: SceneConfig['theme'],
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
  };
}

function outlineRoom(floor: string[][], decor: string[][], walkable: boolean[][], wallVariant: string) {
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 16; x++) {
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

function createLobbyScene(): SceneConfig {
  const floor = createBlankGrid('floor');
  const decor = createBlankGrid('');
  const walkable = createWalkableGrid();
  outlineRoom(floor, decor, walkable, 'wall');

  for (let y = 1; y < 11; y++) {
    for (let x = 1; x < 15; x++) {
      floor[y][x] = y <= 3 ? 'floor_blue' : y >= 8 ? 'floor_grid' : 'floor';
    }
  }

  for (const x of [3, 7, 11]) {
    decor[2][x] = 'desk';
    decor[2][x + 1] = 'desk';
    block(walkable, x, 2);
    block(walkable, x + 1, 2);
  }
  decor[8][12] = 'bench';
  decor[8][13] = 'bench';
  block(walkable, 12, 8);
  block(walkable, 13, 8);
  decor[4][12] = 'holo';
  block(walkable, 12, 4);

  const locations = {
    lobby_desk_1: { x: 3, y: 3, label: '前台工位 1' },
    lobby_desk_2: { x: 7, y: 3, label: '前台工位 2' },
    lobby_desk_3: { x: 11, y: 3, label: '前台工位 3' },
    lobby_center: { x: 8, y: 6, label: '大厅中枢' },
    lobby_map: { x: 11, y: 5, label: '作战投影' },
    lobby_window_bench: { x: 12, y: 9, label: '观景长椅' },
    lobby_walk_1: { x: 5, y: 7, label: '走廊 A' },
    lobby_walk_2: { x: 9, y: 7, label: '走廊 B' },
    lobby_walk_3: { x: 4, y: 9, label: '回廊' },
  };

  return finalizeScene('wuwa-lobby', 'blue', floor, decor, walkable, locations);
}

function createMeetingScene(): SceneConfig {
  const floor = createBlankGrid('floor_green');
  const decor = createBlankGrid('');
  const walkable = createWalkableGrid();
  outlineRoom(floor, decor, walkable, 'wall_green');

  for (let y = 1; y < 11; y++) {
    for (let x = 1; x < 15; x++) {
      floor[y][x] = y >= 4 && y <= 7 ? 'floor_resonance' : 'floor_green';
    }
  }

  for (const [x, y] of [[4, 3], [7, 3], [10, 3]]) {
    decor[y][x] = 'console';
    decor[y][x + 1] = 'console';
    block(walkable, x, y);
    block(walkable, x + 1, y);
  }
  decor[6][12] = 'board';
  block(walkable, 12, 6);
  decor[8][3] = 'chair';
  block(walkable, 3, 8);

  const locations = {
    meeting_console_1: { x: 4, y: 4, label: '共鸣台 1' },
    meeting_console_2: { x: 8, y: 4, label: '共鸣台 2' },
    meeting_console_3: { x: 11, y: 4, label: '共鸣台 3' },
    meeting_center: { x: 8, y: 6, label: '共鸣核心' },
    meeting_board: { x: 11, y: 7, label: '战术板' },
    meeting_recliner: { x: 3, y: 9, label: '校准椅' },
    meeting_walk_1: { x: 5, y: 8, label: '走道 A' },
    meeting_walk_2: { x: 9, y: 8, label: '走道 B' },
    meeting_walk_3: { x: 13, y: 8, label: '走道 C' },
  };

  return finalizeScene('wuwa-meeting', 'green', floor, decor, walkable, locations);
}

function createLoungeScene(): SceneConfig {
  const floor = createBlankGrid('floor_warm');
  const decor = createBlankGrid('');
  const walkable = createWalkableGrid();
  outlineRoom(floor, decor, walkable, 'wall_warm');

  for (let y = 1; y < 11; y++) {
    for (let x = 1; x < 15; x++) {
      floor[y][x] = x >= 9 ? 'floor_carpet' : 'floor_warm';
    }
  }

  for (const [x, y] of [[10, 7], [11, 7], [4, 8]]) {
    decor[y][x] = 'couch';
    block(walkable, x, y);
  }
  decor[5][11] = 'window';
  block(walkable, 11, 5);
  decor[3][4] = 'table';
  decor[3][5] = 'table';
  block(walkable, 4, 3);
  block(walkable, 5, 3);
  decor[4][2] = 'bar';
  decor[4][3] = 'bar';
  block(walkable, 2, 4);
  block(walkable, 3, 4);

  const locations = {
    lounge_reading_table: { x: 4, y: 4, label: '阅读桌' },
    lounge_bar: { x: 3, y: 5, label: '补给台' },
    lounge_couch_1: { x: 10, y: 8, label: '沙发 A' },
    lounge_couch_2: { x: 11, y: 8, label: '沙发 B' },
    lounge_daybed: { x: 4, y: 9, label: '日光榻' },
    lounge_window: { x: 10, y: 5, label: '观景窗' },
    lounge_center: { x: 8, y: 6, label: '暖光区' },
    lounge_walk_1: { x: 6, y: 8, label: '走道 A' },
    lounge_walk_2: { x: 8, y: 9, label: '走道 B' },
    lounge_walk_3: { x: 12, y: 4, label: '走道 C' },
  };

  return finalizeScene('wuwa-lounge', 'warm', floor, decor, walkable, locations);
}

function createTrainingScene(): SceneConfig {
  const floor = createBlankGrid('floor_purple');
  const decor = createBlankGrid('');
  const walkable = createWalkableGrid();
  outlineRoom(floor, decor, walkable, 'wall_purple');

  for (let y = 1; y < 11; y++) {
    for (let x = 1; x < 15; x++) {
      floor[y][x] = x >= 5 && x <= 10 && y >= 4 && y <= 8 ? 'floor_ring' : 'floor_purple';
    }
  }

  for (const [x, y] of [[6, 5], [9, 5], [6, 7], [9, 7]]) {
    decor[y][x] = 'pillar';
    block(walkable, x, y);
  }
  decor[12 - 8][12] = 'holo';
  block(walkable, 12, 4);
  decor[3][3] = 'console';
  decor[3][4] = 'console';
  block(walkable, 3, 3);
  block(walkable, 4, 3);
  decor[9][12] = 'pod';
  block(walkable, 12, 9);

  const locations = {
    training_console: { x: 4, y: 4, label: '训练控制台' },
    training_ring_north: { x: 8, y: 4, label: '训练环北位' },
    training_ring_south: { x: 8, y: 8, label: '训练环南位' },
    training_center: { x: 8, y: 6, label: '训练环核心' },
    training_holo: { x: 11, y: 5, label: '全息靶场' },
    training_pod: { x: 12, y: 10, label: '恢复舱' },
    training_walk_1: { x: 4, y: 8, label: '走道 A' },
    training_walk_2: { x: 11, y: 8, label: '走道 B' },
    training_walk_3: { x: 12, y: 3, label: '走道 C' },
  };

  return finalizeScene('wuwa-training', 'purple', floor, decor, walkable, locations);
}
