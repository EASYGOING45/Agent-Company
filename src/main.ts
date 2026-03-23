/**
 * 鸣潮元宇宙 - 主入口
 */

import { Renderer } from './canvas/Renderer.ts';
import { Scene } from './scene/Scene.ts';
import { Citizen, CitizenLayer, type AgentState } from './citizens/Citizen.ts';
import { SpriteSheet } from './sprites/SpriteSheet.ts';
import { ParticleSystem } from './effects/Particles.ts';
import { SpeechBubbleSystem } from './effects/SpeechBubble.ts';
import { Signal, type AgentStatus } from './signal/Signal.ts';
import {
  INITIAL_CITIZENS,
  REGION_ORDER,
  createWorldDefinition,
  inferRegionFromLocation,
  type RegionId,
} from './world/WuWaWorld.ts';
import type { SpriteSheetConfig } from './sprites/types.ts';

const WORLD = createWorldDefinition();
interface SpriteProfile {
  body: string;
  hair: string;
  shadow: string;
  accent: string;
  trim: string;
  silhouette: 'halo' | 'longHair' | 'cloak' | 'armor' | 'coat' | 'dress' | 'twinTail' | 'cape' | 'scarf';
}

const SPRITE_PROFILES: Record<string, SpriteProfile> = {
  phoebe: { body: '#f3c56b', hair: '#fff1c8', shadow: '#35220e', accent: '#ffe28d', trim: '#7c5316', silhouette: 'halo' },
  jinxi: { body: '#7fe4d6', hair: '#ecfffb', shadow: '#10342c', accent: '#b9fff6', trim: '#2d6f63', silhouette: 'longHair' },
  changli: { body: '#ff9f72', hair: '#ffe7d6', shadow: '#4a1f11', accent: '#ffd08f', trim: '#973d23', silhouette: 'cloak' },
  jiyan: { body: '#87f0c7', hair: '#edfff7', shadow: '#143126', accent: '#b5ffd7', trim: '#2f7459', silhouette: 'armor' },
  xiangliyao: { body: '#7fc2ff', hair: '#eaf6ff', shadow: '#132740', accent: '#b4dcff', trim: '#3568a1', silhouette: 'coat' },
  colletta: { body: '#b79cff', hair: '#f3ecff', shadow: '#261a46', accent: '#e6d6ff', trim: '#6a52a8', silhouette: 'dress' },
  roccia: { body: '#ffb4d8', hair: '#fff0f7', shadow: '#4a1e31', accent: '#ffd4ea', trim: '#ab507b', silhouette: 'twinTail' },
  zani: { body: '#ffd07a', hair: '#fff5da', shadow: '#493113', accent: '#ffe7aa', trim: '#9f6b22', silhouette: 'cape' },
  brant: { body: '#72c3ff', hair: '#e5f6ff', shadow: '#13314a', accent: '#9fe4ff', trim: '#2c6d93', silhouette: 'scarf' },
};
const SPRITE_CONFIGS = Object.fromEntries(
  Object.entries(SPRITE_PROFILES).map(([sprite, profile]) => [
    sprite,
    createWuWaSpriteConfig(profile),
  ])
) as Record<string, SpriteSheetConfig>;

type CitizenAgentSnapshot = AgentStatus & { agent: string };

class WuWaVerse {
  private renderer: Renderer;
  private scene: Scene;
  private citizens: Citizen[] = [];
  private citizenLayer = new CitizenLayer();
  private particles = new ParticleSystem();
  private speechBubbles = new SpeechBubbleSystem();
  private signal: Signal;
  private particleTimers = new Map<string, number>();
  private idleTimers = new Map<string, number>();
  private agents = new Map<string, CitizenAgentSnapshot>();
  private activeRegion: RegionId = 'rinascita';
  private selectedCitizen: Citizen | null = null;

  constructor(private container: HTMLElement, config: { wsUrl: string; agentsUrl: string; heartbeatUrl: string }) {
    this.renderer = new Renderer(container, 512, 384, 2);
    this.scene = new Scene(WORLD[this.activeRegion].scene);
    this.signal = new Signal({
      url: config.wsUrl,
      agentsUrl: config.agentsUrl,
      heartbeatUrl: config.heartbeatUrl,
    });

    this.renderer.addLayer(this.scene);
    this.renderer.addLayer({
      order: 1,
      render: (_ctx, delta) => {
        this.updateCitizens(delta);
      },
    });
    this.renderer.addLayer(this.citizenLayer);
    this.renderer.addLayer(this.particles);
    this.renderer.addLayer(this.speechBubbles);

    this.renderer.canvas.addEventListener('click', (event) => this.handleClick(event));
    this.signal.onUpdate((agents) => this.handleSignalUpdate(agents as CitizenAgentSnapshot[]));
    wireRegionButtons((region) => void this.switchRegion(region));
  }

  async start() {
    await this.scene.load();

    for (const config of INITIAL_CITIZENS) {
      const spriteConfig = SPRITE_CONFIGS[config.sprite];
      if (!spriteConfig) continue;

      const sheet = new SpriteSheet(spriteConfig);
      await sheet.load();

      const citizen = new Citizen(config, sheet, this.scene.config.tileWidth, this.scene.config.tileHeight);
      const initialRegion = config.region ?? inferRegionFromLocation(config.position);
      citizen.setRoom(initialRegion);
      const initialScene = WORLD[initialRegion].scene;
      const location = initialScene.locations[config.position];
      if (location) {
        citizen.setTilePosition(location.x, location.y);
      }

      this.citizens.push(citizen);
      this.agents.set(config.agentId, {
        id: config.agentId,
        agent: config.agentId,
        name: config.name,
        state: 'idle',
        task: `${config.faction} 待命`,
        energy: 1,
        color: config.color,
        room: initialRegion,
        region: initialRegion,
        role: config.role,
        faction: config.faction,
      });
    }

    this.citizenLayer.setCitizens(this.citizens);
    this.refreshRegionUi();
    this.refreshAgentUi();
    this.signal.start();
    this.renderer.start();
  }

  stop() {
    this.renderer.stop();
    this.signal.stop();
  }

  private updateCitizens(delta: number) {
    const blockedByCitizen = new Map<string, string>();
    for (const citizen of this.citizens.filter((entry) => entry.visible && entry.room === this.activeRegion)) {
      for (const reserved of citizen.getReservedTiles()) {
        blockedByCitizen.set(reserved, citizen.agentId);
      }
    }

    for (const citizen of this.citizens) {
      citizen.visible = citizen.state !== 'offline' && citizen.room === this.activeRegion;
      this.routeCitizen(citizen, delta, blockedByCitizen);
      const blockedTiles = new Set<string>();
      for (const [tile, owner] of blockedByCitizen) {
        if (owner !== citizen.agentId) blockedTiles.add(tile);
      }
      citizen.update(delta, this.scene.pathfinder, { blockedTiles });
      this.updateCitizenEffects(citizen, delta);
    }
  }

  private routeCitizen(citizen: Citizen, delta: number, blockedByCitizen: Map<string, string>) {
    const snapshot = this.agents.get(citizen.agentId);
    const region = this.resolveDesiredRegion(citizen, snapshot);
    if (region !== citizen.room) {
      citizen.setRoom(region);
      citizen.clearTarget();
    }

    if (citizen.room !== this.activeRegion) {
      return;
    }

    if (!citizen.isMoving()) {
      const targetLocation = this.chooseTargetLocation(citizen, snapshot);
      if (targetLocation && targetLocation !== citizen.currentTargetLocation) {
        this.moveCitizenToLocation(citizen, targetLocation, blockedByCitizen);
      }
    }

    if (citizen.state === 'idle' && !citizen.isMoving()) {
      const timer = (this.idleTimers.get(citizen.agentId) ?? 0) + delta;
      const nextDelay = 2.5 + ((hashString(citizen.agentId) % 7) * 0.25);
      if (timer >= nextDelay) {
        this.idleTimers.set(citizen.agentId, 0);
        const wander = pickFromArray(
          WORLD[this.activeRegion].wanderZones,
          citizen.agentId,
          Math.floor(performance.now() / 1000)
        );
        if (wander) {
          this.moveCitizenToLocation(citizen, wander, blockedByCitizen);
        }
      } else {
        this.idleTimers.set(citizen.agentId, timer);
      }
    } else {
      this.idleTimers.set(citizen.agentId, 0);
    }
  }

  private moveCitizenToLocation(citizen: Citizen, locationKey: string, blockedByCitizen: Map<string, string>) {
    const location = this.scene.getLocation(locationKey);
    if (!location) return;

    const { x: startX, y: startY } = citizen.getTilePosition();
    const path = this.scene.pathfinder.findPath(startX, startY, location.x, location.y);
    if (path.length <= 1) return;

    const destinationKey = `${location.x},${location.y}`;
    const occupiedBy = blockedByCitizen.get(destinationKey);
    if (occupiedBy && occupiedBy !== citizen.agentId) {
      return;
    }

    citizen.walkTo(path, locationKey);
  }

  private handleSignalUpdate(agents: CitizenAgentSnapshot[]) {
    for (const agent of agents) {
      const region = normalizeRegion(agent.region ?? agent.room);
      const nextAgent = {
        ...agent,
        region,
        room: region,
      };
      this.agents.set(agent.agent, nextAgent);
      const citizen = this.citizens.find((entry) => entry.agentId === agent.agent);
      if (!citizen) continue;

      const prevState = citizen.state;
      citizen.updateState(normalizeState(agent.state), agent.task, agent.energy, region);

      if (prevState !== citizen.state) {
        const anchor = citizen.getScreenAnchor();
        if (citizen.state === 'working' && agent.task) {
          this.speechBubbles.show(anchor.x, anchor.y, agent.task, 4);
        } else if (citizen.state === 'speaking' && agent.task) {
          this.speechBubbles.show(anchor.x, anchor.y, agent.task, 5);
        } else if (citizen.state === 'error') {
          this.particles.emitExclamation(anchor.x, anchor.y);
        }
      }
    }

    this.refreshAgentUi();
    this.refreshSelectedCitizen();
  }

  private updateCitizenEffects(citizen: Citizen, delta: number) {
    if (citizen.room !== this.activeRegion) return;

    const timer = (this.particleTimers.get(citizen.agentId) ?? 0) + delta;
    this.particleTimers.set(citizen.agentId, timer);

    if (timer > 0.18) {
      this.particleTimers.set(citizen.agentId, 0);
      const anchor = citizen.getScreenAnchor();
      this.particles.emitNoise(anchor.x, anchor.floorY - 6, citizen.color);
      if (citizen.state === 'sleeping') {
        this.particles.emitZzz(anchor.x, anchor.y);
      } else if (citizen.state === 'thinking') {
        this.particles.emitThought(anchor.x, anchor.y);
      } else if (citizen.state === 'error') {
        this.particles.emitExclamation(anchor.x, anchor.y);
      }
    }
  }

  private handleClick(event: MouseEvent) {
    const world = this.renderer.screenToWorld(event.clientX, event.clientY);
    const target = [...this.citizens]
      .filter((citizen) => citizen.visible && citizen.containsPoint(world.x, world.y))
      .sort((a, b) => b.y - a.y)[0];

    if (!target) return;
    for (const citizen of this.citizens) citizen.setSelected(false);
    target.setSelected(true);
    this.selectedCitizen = target;
    this.refreshSelectedCitizen();
    const snapshot = this.agents.get(target.agentId);
    const status = snapshot?.task ? `${target.name}: ${snapshot.task}` : `${target.name}: ${target.state}`;
    const anchor = target.getScreenAnchor();
    this.speechBubbles.show(anchor.x, anchor.y, status, 3);
  }

  private async switchRegion(region: RegionId) {
    if (region === this.activeRegion) return;
    this.activeRegion = region;
    await this.scene.setConfig(WORLD[region].scene);
    for (const citizen of this.citizens) {
      citizen.setSelected(citizen === this.selectedCitizen && citizen.room === region);
    }
    this.refreshRegionUi();
    this.refreshAgentUi();
    this.refreshSelectedCitizen();
  }

  private resolveDesiredRegion(citizen: Citizen, snapshot?: CitizenAgentSnapshot): RegionId {
    if (snapshot?.region && snapshot.region in WORLD) {
      return snapshot.region as RegionId;
    }
    if (snapshot?.room && snapshot.room in WORLD) {
      return snapshot.room as RegionId;
    }
    return normalizeRegion(citizen.anchorLocation);
  }

  private chooseTargetLocation(citizen: Citizen, snapshot?: CitizenAgentSnapshot): string | null {
    const region = WORLD[this.activeRegion];
    if (citizen.room !== region.id) return null;
    const candidates = region.stateTargets[citizen.state] ?? region.wanderZones;
    const seed = `${citizen.agentId}:${snapshot?.task ?? citizen.task ?? citizen.state}`;
    return pickFromArray(candidates, seed, 0) ?? null;
  }

  private refreshRegionUi() {
    const region = WORLD[this.activeRegion];
    document.body.dataset.room = region.id;
    document.body.style.setProperty('--scene-image', region.scene.backdrop ? `url("${region.scene.backdrop}")` : 'none');
    document.body.style.setProperty('--accent', region.palette.primary);
    document.body.style.setProperty('--accent-soft', region.palette.glow);
    document.body.style.setProperty('--accent-secondary', region.palette.secondary);
    document.body.style.setProperty('--region-wash', `${region.palette.primary}18`);
    const roomName = document.getElementById('room-name');
    const stageName = document.getElementById('room-name-stage');
    const roomTagline = document.getElementById('room-tagline');
    const roomHighlights = document.getElementById('room-highlights');
    const sceneName = document.getElementById('region-scene-name');
    const sceneMeta = document.getElementById('region-scene-meta');
    if (roomName) roomName.textContent = region.name;
    if (stageName) stageName.textContent = `${region.name} · ${region.shortName}`;
    if (roomTagline) roomTagline.textContent = region.tagline;
    if (roomHighlights) roomHighlights.textContent = `地标：${region.highlights.join(' · ')}`;
    if (sceneName) sceneName.textContent = region.shortName;
    if (sceneMeta) sceneMeta.textContent = region.description;
    setElementBackground(document.getElementById('region-scene-art'), region.scene.backdrop ?? null);

    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-region-switch]')) {
      button.classList.toggle('active', button.dataset.regionSwitch === region.id);
    }
  }

  private refreshAgentUi() {
    const onlineCount = document.getElementById('online-count');
    const activeAgents = [...this.agents.values()].filter((agent) => normalizeState(agent.state) !== 'offline');
    if (onlineCount) onlineCount.textContent = String(activeAgents.length);

    const info = document.getElementById('agents-info');
    if (info) {
      const list = this.citizens
        .filter((citizen) => citizen.room === this.activeRegion)
        .map((citizen) => {
          const agent = this.agents.get(citizen.agentId);
          const task = agent?.task ?? citizen.task ?? '待命中';
          const faction = agent?.faction ?? '自由共鸣者';
          return `${citizen.name} · ${faction} · ${labelState(citizen.state)} · ${task}`;
        });
      info.textContent = list.length > 0 ? list.join('\n') : '当前地区暂无活跃共鸣者。';
    }
  }

  private refreshSelectedCitizen() {
    const panel = document.getElementById('citizen-card');
    const title = document.getElementById('citizen-name');
    const meta = document.getElementById('citizen-meta');
    const task = document.getElementById('citizen-task');
    const energy = document.getElementById('citizen-energy');
    const room = document.getElementById('citizen-room');
    const faction = document.getElementById('citizen-faction');
    const avatarChip = document.getElementById('citizen-avatar-chip');
    if (!panel || !title || !meta || !task || !energy || !room || !faction || !avatarChip) return;

    const selected = this.selectedCitizen;
    if (!selected) {
      panel.classList.add('is-empty');
      title.textContent = '选择共鸣者';
      meta.textContent = '点击画布中的角色查看详情';
      faction.textContent = '共鸣者档案';
      task.textContent = '--';
      energy.textContent = '--';
      room.textContent = WORLD[this.activeRegion].name;
      setElementBackground(document.getElementById('citizen-art'), WORLD[this.activeRegion].scene.backdrop ?? null);
      setElementBackground(avatarChip, null);
      return;
    }

    const snapshot = this.agents.get(selected.agentId);
    for (const citizen of this.citizens) citizen.setSelected(citizen === selected && citizen.room === this.activeRegion);
    panel.classList.remove('is-empty');
    title.textContent = selected.name;
    meta.textContent = `${snapshot?.faction ?? selected.role} · ${labelState(selected.state)}`;
    faction.textContent = snapshot?.faction ?? selected.role;
    task.textContent = snapshot?.task ?? selected.task ?? '待命中';
    energy.textContent = `${Math.round((snapshot?.energy ?? selected.energy) * 100)}%`;
    room.textContent = WORLD[normalizeRegion(snapshot?.region ?? selected.room)].name;
    setElementBackground(document.getElementById('citizen-art'), selected.avatarPath);
    setElementBackground(avatarChip, selected.avatarPath);
  }
}

function normalizeState(value: string | undefined): AgentState {
  switch (value) {
    case 'working':
    case 'idle':
    case 'thinking':
    case 'sleeping':
    case 'speaking':
    case 'error':
    case 'offline':
      return value;
    default:
      return 'idle';
  }
}

function normalizeRegion(value: string | undefined): RegionId {
  if (!value) return 'rinascita';
  if (value in WORLD) return value as RegionId;
  return inferRegionFromLocation(value);
}

function labelState(state: AgentState): string {
  return {
    working: '执行中',
    idle: '待命',
    thinking: '思考中',
    sleeping: '休眠',
    speaking: '同步中',
    error: '异常',
    offline: '离线',
  }[state];
}

function pickFromArray<T>(items: T[], seed: string, offset: number): T | undefined {
  if (items.length === 0) return undefined;
  const index = Math.abs(hashString(`${seed}:${offset}`)) % items.length;
  return items[index];
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return hash;
}

function wireRegionButtons(onSwitch: (region: RegionId) => void) {
  for (const region of REGION_ORDER) {
    const button = document.querySelector<HTMLButtonElement>(`[data-region-switch="${region}"]`);
    button?.addEventListener('click', () => onSwitch(region));
  }
}

function createWuWaSpriteConfig(profile: SpriteProfile): SpriteSheetConfig {
  return {
    sheets: {
      walk: createWuWaSpriteSheet(profile, 'walk'),
      actions: createWuWaSpriteSheet(profile, 'actions'),
    },
    animations: {
      idle_down: { sheet: 'actions', row: 0, frames: 4, speed: 0.22 },
      idle_up: { sheet: 'actions', row: 1, frames: 4, speed: 0.22 },
      idle_left: { sheet: 'actions', row: 2, frames: 4, speed: 0.22 },
      idle_right: { sheet: 'actions', row: 3, frames: 4, speed: 0.22 },
      working: { sheet: 'actions', row: 4, frames: 4, speed: 0.16, frameDurations: [0.12, 0.16, 0.16, 0.22] },
      sleeping: { sheet: 'actions', row: 5, frames: 4, speed: 0.36, frameDurations: [0.5, 0.4, 0.5, 0.7] },
      talking: { sheet: 'actions', row: 6, frames: 4, speed: 0.14, frameDurations: [0.12, 0.1, 0.14, 0.18] },
      walk_down: { sheet: 'walk', row: 0, frames: 4, speed: 0.12, offsetY: -2 },
      walk_up: { sheet: 'walk', row: 1, frames: 4, speed: 0.12, offsetY: -2 },
      walk_left: { sheet: 'walk', row: 2, frames: 4, speed: 0.12, offsetY: -2 },
      walk_right: { sheet: 'walk', row: 3, frames: 4, speed: 0.12, offsetY: -2 },
    },
    frameWidth: 24,
    frameHeight: 24,
    defaultScale: 1,
    defaultOffsetY: -2,
  };
}

function createWuWaSpriteSheet(profile: SpriteProfile, type: 'walk' | 'actions') {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = type === 'walk' ? 96 : 168;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.imageSmoothingEnabled = false;

  for (let row = 0; row < canvas.height / 24; row += 1) {
    for (let frame = 0; frame < 4; frame += 1) {
      drawFrame(ctx, frame * 24, row * 24, profile, row, frame, type);
    }
  }

  return canvas.toDataURL();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  profile: SpriteProfile,
  row: number,
  frame: number,
  type: 'walk' | 'actions'
) {
  const { body, hair, shadow, accent, trim, silhouette } = profile;
  const bob = type === 'walk' ? (frame % 2 === 0 ? 0 : 1) : row === 5 ? 1 : 0;
  const sway = type === 'walk' ? (frame % 2 === 0 ? -1 : 1) : 0;
  const faceLeft = row === 2;
  const faceRight = row === 3;
  const faceUp = row === 1;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.imageSmoothingEnabled = false;

  const legOffset = type === 'walk' ? (frame % 2 === 0 ? 0 : 1) : 0;
  const armShift = type === 'actions' && row === 6 ? 1 : 0;

  ctx.fillStyle = shadow;
  ctx.fillRect(9, 17, 2, 4);
  ctx.fillRect(13, 17 + legOffset, 2, 4 - legOffset);
  ctx.fillRect(8, 20, 8, 1);

  if (silhouette === 'cape' || silhouette === 'cloak' || silhouette === 'dress') {
    ctx.fillRect(7 + sway, 15, 10, 4);
  }

  if (silhouette === 'longHair' || silhouette === 'twinTail' || silhouette === 'scarf') {
    ctx.fillRect(8, 8, 1, 8);
    ctx.fillRect(15, 8, 1, 8);
  }

  ctx.fillStyle = body;
  ctx.fillRect(8 + sway, 10, 8, 8);
  ctx.fillRect(7 + sway - armShift, 11, 2, 5);
  ctx.fillRect(16 + sway + armShift, 11, 2, 5);
  ctx.fillStyle = trim;
  ctx.fillRect(9 + sway, 10, 6, 1);
  ctx.fillRect(10 + sway, 15, 4, 2);

  ctx.fillStyle = hair;
  ctx.fillRect(9, 5, 6, 5);
  ctx.fillRect(10, 4, 4, 1);
  ctx.fillStyle = '#f7efe5';
  ctx.fillRect(11, 7, 2, 1);

  drawSilhouetteDetail(ctx, silhouette, accent, trim, shadow, frame, sway, row, type);

  if (faceUp) {
    ctx.fillStyle = shadow;
    ctx.fillRect(10, 5, 4, 2);
  } else if (faceLeft) {
    ctx.fillStyle = shadow;
    ctx.fillRect(9, 6, 1, 3);
  } else if (faceRight) {
    ctx.fillStyle = shadow;
    ctx.fillRect(14, 6, 1, 3);
  }

  if (type === 'actions' && row === 4) {
    ctx.fillStyle = hexAlpha(accent, 0.45);
    ctx.fillRect(7, 9, 10, 1);
    ctx.fillRect(6 + frame, 18, 12 - frame, 1);
  } else if (type === 'actions' && row === 5 && frame % 2 === 0) {
    ctx.fillStyle = '#d7c6ff';
    ctx.fillRect(16, 3, 2, 2);
  } else if (type === 'actions' && row === 6) {
    ctx.fillStyle = '#ffd782';
    ctx.fillRect(17, 9, 2, 2);
  }

  ctx.restore();
}

function drawSilhouetteDetail(
  ctx: CanvasRenderingContext2D,
  silhouette: SpriteProfile['silhouette'],
  accent: string,
  trim: string,
  shadow: string,
  frame: number,
  sway: number,
  row: number,
  type: 'walk' | 'actions'
) {
  switch (silhouette) {
    case 'halo':
      ctx.fillStyle = accent;
      ctx.fillRect(10, 2, 4, 1);
      if (type === 'actions' && row === 4) ctx.fillRect(9, 2, 6, 1);
      break;
    case 'longHair':
      ctx.fillStyle = trim;
      ctx.fillRect(8, 9, 1, 7);
      ctx.fillRect(15, 9, 1, 7);
      ctx.fillStyle = accent;
      ctx.fillRect(12, 3, 1, 1);
      break;
    case 'cloak':
      ctx.fillStyle = trim;
      ctx.fillRect(7 + sway, 12, 2, 6);
      ctx.fillRect(15 + sway, 12, 2, 6);
      ctx.fillStyle = accent;
      ctx.fillRect(9 + sway, 11, 6, 1);
      break;
    case 'armor':
      ctx.fillStyle = trim;
      ctx.fillRect(7 + sway, 11, 3, 2);
      ctx.fillRect(14 + sway, 11, 3, 2);
      ctx.fillStyle = accent;
      ctx.fillRect(11 + sway, 12, 2, 4);
      break;
    case 'coat':
      ctx.fillStyle = trim;
      ctx.fillRect(8 + sway, 14, 8, 4);
      ctx.fillStyle = accent;
      ctx.fillRect(11 + sway, 10, 2, 8);
      break;
    case 'dress':
      ctx.fillStyle = trim;
      ctx.fillRect(7 + sway, 15, 10, 3);
      ctx.fillStyle = accent;
      ctx.fillRect(9 + sway, 11, 6, 1);
      break;
    case 'twinTail':
      ctx.fillStyle = trim;
      ctx.fillRect(7, 8, 1, 5);
      ctx.fillRect(16, 8, 1, 5);
      ctx.fillStyle = accent;
      ctx.fillRect(9, 4, 1, 1);
      ctx.fillRect(14, 4, 1, 1);
      break;
    case 'cape':
      ctx.fillStyle = trim;
      ctx.fillRect(7 + sway, 12, 10, 6);
      ctx.fillStyle = accent;
      ctx.fillRect(8 + sway, 11, 8, 1);
      break;
    case 'scarf':
      ctx.fillStyle = accent;
      ctx.fillRect(8 + sway, 11, 8, 2);
      ctx.fillStyle = shadow;
      ctx.fillRect(7 + sway + (frame % 2), 13, 2, 4);
      break;
  }
}

function hexAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const int = Number.parseInt(value, 16);
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
}

function setElementBackground(element: HTMLElement | null, src: string | null) {
  if (!element) return;
  element.style.backgroundImage = src
    ? `linear-gradient(180deg, rgba(8, 12, 28, 0.1), rgba(8, 12, 28, 0.85)), url("${src}")`
    : 'none';
}

async function init() {
  const app = document.getElementById('app');
  if (!app) {
    throw new Error('找不到 #app 容器');
  }

  const loading = document.getElementById('loading');
  if (loading) loading.remove();

  const isViteDev = window.location.port === '5173';
  const origin = isViteDev ? `${window.location.protocol}//${window.location.hostname}:4321` : window.location.origin;
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = isViteDev ? `${window.location.hostname}:4321` : window.location.host;
  const wsUrl = `${wsProtocol}//${wsHost}/api/ws`;
  const wuwa = new WuWaVerse(app, {
    wsUrl,
    agentsUrl: `${origin}/api/agents`,
    heartbeatUrl: `${origin}/api/heartbeat`,
  });
  await wuwa.start();

  window.addEventListener('beforeunload', () => {
    wuwa.stop();
  });
}

init().catch((error) => {
  console.error('[WuWaVerse] 启动失败', error);
});
