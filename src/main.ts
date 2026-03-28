/**
 * 鸣潮元宇宙 - 主入口
 */

import { Renderer, getCurrentProjection, projectIso } from './canvas/Renderer.ts';
import { Scene } from './scene/Scene.ts';
import { Citizen, CitizenLayer, type AgentState } from './citizens/Citizen.ts';
import { SpriteSheet } from './sprites/SpriteSheet.ts';
import { ParticleSystem } from './effects/Particles.ts';
import { SpeechBubbleSystem } from './effects/SpeechBubble.ts';
import { Signal, type AgentStatus } from './signal/Signal.ts';
import { UiController, type CharacterDetail, type ChatEntry, type SettingsState } from './ui/UiController.ts';
import { THEMES, loadTheme, saveTheme } from './data.js';
import {
  INITIAL_CITIZENS,
  REGION_ORDER,
  createWorldDefinition,
  inferRegionFromLocation,
  type RegionId,
} from './world/WuWaWorld.ts';
import type { SpriteSheetConfig } from './sprites/types.ts';

const WORLD = createWorldDefinition();
type ThemeId = (typeof THEMES)[number]['id'];
interface SpriteProfile {
  body: string;
  hair: string;
  shadow: string;
  accent: string;
  trim: string;
  silhouette: 'halo' | 'longHair' | 'cloak' | 'armor' | 'coat' | 'dress' | 'twinTail' | 'cape' | 'scarf';
}

const SPRITE_PROFILES: Record<string, SpriteProfile> = {
  phoebe: { body: '#d6b07f', hair: '#fff1c8', shadow: '#35220e', accent: '#f2cb96', trim: '#7c5316', silhouette: 'halo' },
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
type MemberStatus = 'online' | 'idle' | 'busy' | 'offline';
type MemberStatusMap = Partial<Record<string, MemberStatus>>;

interface MemberStatusCard {
  id: string;
  name: string;
  role: string;
  faction: string;
  task: string;
  status: MemberStatus;
  room: RegionId;
  isSelf: boolean;
  isSelected: boolean;
}

const MEMBER_STATUS_STORAGE_KEY = 'agent-company-member-status';
const EDITABLE_MEMBER_ID = 'phoebe';
const DEFAULT_THEME_ID: ThemeId = 'resonance';
const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  online: '在线',
  idle: '摸鱼中',
  busy: '工作中',
  offline: '离线',
};
const MEMBER_STATUS_ORDER: MemberStatus[] = ['online', 'idle', 'busy', 'offline'];

function resolveTheme(themeId: string | null | undefined): ThemeId {
  return THEMES.some((theme) => theme.id === themeId) ? (themeId as ThemeId) : DEFAULT_THEME_ID;
}

export function getThemes() {
  return THEMES;
}

export function applyTheme(themeId: string) {
  const nextTheme = resolveTheme(themeId);
  document.body.dataset.theme = nextTheme;
  saveTheme(nextTheme);
  return nextTheme;
}

applyTheme(loadTheme());

interface ExitDefinition {
  region: RegionId;
  label: string;
  location: string;
}

interface ExitHotspot extends ExitDefinition {
  x: number;
  y: number;
  radius: number;
}

const REGION_EXITS: Record<RegionId, ExitDefinition[]> = {
  huanglong: [
    { region: 'blackshores', label: '潮汐航道', location: 'huanglong_rainbow_town' },
    { region: 'rinascita', label: '修会渡桥', location: 'huanglong_cloud_peak' },
    { region: 'frontier', label: '边境补给线', location: 'huanglong_peach_garden' },
  ],
  blackshores: [
    { region: 'huanglong', label: '今州回路', location: 'blackshores_command_desk' },
    { region: 'rinascita', label: '潮汐密门', location: 'blackshores_garden' },
    { region: 'frontier', label: '遗址穿梭', location: 'blackshores_data_wall' },
  ],
  rinascita: [
    { region: 'huanglong', label: '金穹桥', location: 'rinascita_walk_1' },
    { region: 'blackshores', label: '黑潮回线', location: 'rinascita_tide_observatory' },
    { region: 'frontier', label: '北落航廊', location: 'rinascita_cloister' },
  ],
  frontier: [
    { region: 'huanglong', label: '今州前线', location: 'frontier_command_post' },
    { region: 'blackshores', label: '泰缇斯中继', location: 'frontier_ruins_gate' },
    { region: 'rinascita', label: '修会航标', location: 'frontier_field_lab' },
  ],
};

class WuWaVerse {
  private renderer: Renderer;
  private scene: Scene;
  private citizens: Citizen[] = [];
  private citizenLayer = new CitizenLayer();
  private particles = new ParticleSystem();
  private speechBubbles = new SpeechBubbleSystem();
  private signal: Signal;
  private ui = new UiController();
  private particleTimers = new Map<string, number>();
  private idleTimers = new Map<string, number>();
  private speechTimers = new Map<string, number>();
  private agents = new Map<string, CitizenAgentSnapshot>();
  private agentSignatures = new Map<string, string>();
  private chatHistory: ChatEntry[] = [];
  private activeRegion: RegionId = 'rinascita';
  private selectedCitizen: Citizen | null = null;
  private exitHotspots: ExitHotspot[] = [];
  private settings: SettingsState = this.ui.getSettings();
  private memberStatuses: MemberStatusMap = loadMemberStatuses();
  private openStatusPickerId: string | null = null;
  private switchingRegion = false;

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
    this.renderer.addLayer({
      order: 6,
      render: (ctx, delta) => {
        this.renderExitMarkers(ctx, delta);
      },
    });
    this.renderer.addLayer(this.citizenLayer);
    this.renderer.addLayer(this.particles);
    this.renderer.addLayer(this.speechBubbles);

    this.renderer.canvas.addEventListener('click', (event) => this.handleClick(event));
    this.renderer.canvas.addEventListener('mousemove', (event) => this.handleHover(event));
    document.addEventListener('click', (event) => this.handleMemberBoardClick(event));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.openStatusPickerId) {
        this.openStatusPickerId = null;
        this.refreshAgentUi();
      }
    });
    this.signal.onUpdate((agents) => this.handleSignalUpdate(agents as CitizenAgentSnapshot[]));
    this.signal.onEvent((event) => this.handleSignalEvent(event));
    this.signal.onConnectionStateChange((state) => this.ui.setConnectionState(state));
    wireRegionButtons((region) => void this.switchRegion(region));
    this.ui.onSettingsChange((settings) => {
      this.settings = settings;
      this.renderer.setAmbientFx(settings.ambientFx);
      this.applyCameraFocus(this.selectedCitizen !== null);
    });
  }

  async start() {
    this.ui.setLoading(true, '载入多房间基地', '角色精灵、场景纹理与同步信号正在初始化…');
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
      this.agentSignatures.set(config.agentId, this.createAgentSignature(this.agents.get(config.agentId)!));
    }

    this.citizenLayer.setCitizens(this.citizens);
    this.seedChatHistory();
    this.refreshRegionUi();
    this.refreshAgentUi();
    this.refreshSelectedCitizen();
    this.applyCameraFocus(false, true);
    this.ui.setLoading(false);
    this.signal.start();
    this.renderer.start();
  }

  stop() {
    this.renderer.stop();
    this.signal.stop();
  }

  private updateCitizens(delta: number) {
    const blockedByCitizen = new Map<string, string>();
    const activeCitizens = this.citizens.filter((entry) => entry.visible && entry.room === this.activeRegion);

    for (const citizen of activeCitizens) {
      for (const reserved of citizen.getReservedTiles()) {
        blockedByCitizen.set(reserved, citizen.agentId);
      }
    }

    this.updateSpeakingTargets(activeCitizens);

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

    this.syncCharacterPopup();
    this.applyCameraFocus(this.selectedCitizen !== null);
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
      const previous = this.agents.get(agent.agent);
      const nextAgent = {
        ...agent,
        region,
        room: region,
      };
      this.agents.set(agent.agent, nextAgent);
      this.logAgentTransition(previous, nextAgent);
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

    this.logGroupConversation();
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

    const speechTimer = (this.speechTimers.get(citizen.agentId) ?? 0) + delta;
    this.speechTimers.set(citizen.agentId, speechTimer);
    if (speechTimer > 2.3) {
      this.speechTimers.set(citizen.agentId, 0);
      const anchor = citizen.getScreenAnchor();
      const snapshot = this.agents.get(citizen.agentId);
      if (citizen.state === 'speaking' && snapshot?.task) {
        this.speechBubbles.show(anchor.x, anchor.y, snapshot.task, 3.8);
      } else if (citizen.state === 'thinking') {
        this.speechBubbles.show(anchor.x, anchor.y, '正在整理思路…', 2.8);
      } else if (citizen.state === 'working' && snapshot?.task) {
        this.speechBubbles.show(anchor.x, anchor.y, `执行：${snapshot.task}`, 3.2);
      }
    }
  }

  private handleClick(event: MouseEvent) {
    const world = this.renderer.screenToWorld(event.clientX, event.clientY);
    const exit = this.exitHotspots.find((entry) => distanceSq(world.x, world.y, entry.x, entry.y) <= entry.radius * entry.radius);
    if (exit) {
      void this.switchRegion(exit.region);
      return;
    }

    const target = [...this.citizens]
      .filter((citizen) => citizen.visible && citizen.containsPoint(world.x, world.y))
      .sort((a, b) => b.y - a.y)[0];

    if (!target) {
      for (const citizen of this.citizens) citizen.setSelected(false);
      this.selectedCitizen = null;
      this.refreshSelectedCitizen();
      this.syncCharacterPopup();
      return;
    }
    for (const citizen of this.citizens) citizen.setSelected(false);
    target.setSelected(true);
    this.selectedCitizen = target;
    this.refreshSelectedCitizen();
    this.appendChat({
      id: `inspect-${target.agentId}-${Date.now()}`,
      speaker: '系统',
      channel: 'system',
      text: `已打开 ${target.name} 的角色档案`,
      mood: 'info',
      meta: '角色交互',
    });
    const snapshot = this.agents.get(target.agentId);
    const status = snapshot?.task ? `${target.name}: ${snapshot.task}` : `${target.name}: ${target.state}`;
    const anchor = target.getScreenAnchor();
    this.speechBubbles.show(anchor.x, anchor.y, status, 3);
    this.applyCameraFocus(true);
  }

  private async switchRegion(region: RegionId) {
    if (region === this.activeRegion || this.switchingRegion) return;
    this.switchingRegion = true;
    this.openStatusPickerId = null;
    this.ui.setLoading(true, `切换至 ${WORLD[region].name}`, '镜头与场景正在重构路线…');
    await this.renderer.playTransition(WORLD[region].name, async () => {
      this.activeRegion = region;
      await this.scene.setConfig(WORLD[region].scene);
      this.applyCameraFocus(false, true);
    });
    for (const citizen of this.citizens) {
      citizen.setSelected(citizen === this.selectedCitizen && citizen.room === region);
    }
    this.refreshRegionUi();
    this.refreshAgentUi();
    this.refreshSelectedCitizen();
    this.appendChat({
      id: `room-${region}-${Date.now()}`,
      speaker: '系统',
      channel: 'system',
      text: `视角已切换至 ${WORLD[region].name}，可点击出口继续漫游。`,
      mood: 'info',
      meta: '房间导航',
    });
    this.ui.setLoading(false);
    this.switchingRegion = false;
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
    this.ui.setExitSummary(REGION_EXITS[region.id].map((entry) => `${entry.label} → ${WORLD[entry.region].name}`));

    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-region-switch]')) {
      button.classList.toggle('active', button.dataset.regionSwitch === region.id);
    }
  }

  private refreshAgentUi() {
    const onlineCount = document.getElementById('online-count');
    const activeAgents = this.citizens.filter((citizen) => this.getMemberStatus(citizen.agentId, citizen.state) !== 'offline');
    if (onlineCount) onlineCount.textContent = String(activeAgents.length);

    const board = document.getElementById('member-status-board');
    if (board) {
      const cards = this.citizens
        .filter((citizen) => citizen.room === this.activeRegion)
        .map((citizen) => this.buildMemberStatusCard(citizen));

      board.innerHTML = cards.length > 0
        ? cards.map((card) => this.renderMemberStatusCard(card)).join('')
        : '<div class="member-status-empty">当前地区暂无可展示成员。</div>';
    }

    const info = document.getElementById('agents-info');
    if (info) {
      const cards = this.citizens
        .filter((citizen) => citizen.room === this.activeRegion)
        .map((citizen) => this.buildMemberStatusCard(citizen));
      const online = cards.filter((card) => card.status === 'online').length;
      const idle = cards.filter((card) => card.status === 'idle').length;
      const busy = cards.filter((card) => card.status === 'busy').length;
      const offline = cards.filter((card) => card.status === 'offline').length;
      info.textContent = cards.length > 0
        ? `在线 ${online} · 摸鱼 ${idle} · 工作 ${busy} · 离线 ${offline}`
        : '当前地区暂无活跃共鸣者。';
    }
    this.ui.setChatHistory(this.chatHistory);
  }

  private buildMemberStatusCard(citizen: Citizen): MemberStatusCard {
    const agent = this.agents.get(citizen.agentId);
    return {
      id: citizen.agentId,
      name: citizen.name,
      role: labelRole(agent?.role ?? citizen.role),
      faction: agent?.faction ?? '自由共鸣者',
      task: agent?.task ?? citizen.task ?? describeActivity(citizen.state),
      status: this.getMemberStatus(citizen.agentId, citizen.state),
      room: normalizeRegion(citizen.room),
      isSelf: citizen.agentId === EDITABLE_MEMBER_ID,
      isSelected: this.selectedCitizen?.agentId === citizen.agentId,
    };
  }

  private renderMemberStatusCard(card: MemberStatusCard): string {
    const statusLabel = MEMBER_STATUS_LABELS[card.status];
    const optionMarkup = card.isSelf && this.openStatusPickerId === card.id
      ? `
        <div class="member-status-options" role="listbox" aria-label="${escapeHtml(card.name)} 状态选择器">
          ${MEMBER_STATUS_ORDER.map((status) => `
            <button
              class="member-status-option ${status === card.status ? 'is-active' : ''}"
              type="button"
              data-status-option="true"
              data-agent-id="${card.id}"
              data-status-value="${status}"
            >
              <span class="member-status-indicator" data-status-tone="${status}">
                <span class="member-status-lamp"></span>
                ${MEMBER_STATUS_LABELS[status]}
              </span>
              <span>${status === card.status ? '当前' : '切换'}</span>
            </button>
          `).join('')}
        </div>
      `
      : '';

    return `
      <article
        class="member-status-card ${card.isSelf ? 'is-self' : ''} ${card.isSelected ? 'is-selected' : ''}"
        data-member-card-id="${card.id}"
        tabindex="0"
        role="button"
        aria-label="${escapeHtml(card.name)} 当前状态 ${statusLabel}"
      >
        <div class="member-status-head">
          <div class="member-status-copy">
            <strong>${escapeHtml(card.name)}</strong>
            <span>${escapeHtml(card.faction)}</span>
          </div>
          <span class="member-status-tag">${card.isSelf ? 'ME' : escapeHtml(card.role)}</span>
        </div>
        <div class="member-status-meta">
          <span class="member-status-indicator" data-status-tone="${card.status}">
            <span class="member-status-lamp"></span>
            ${statusLabel}
          </span>
          <span>${escapeHtml(WORLD[card.room].shortName)}</span>
        </div>
        <p class="member-status-summary">${escapeHtml(card.task)}</p>
        ${optionMarkup}
      </article>
    `;
  }

  private getMemberStatus(agentId: string, fallbackState: AgentState): MemberStatus {
    return this.memberStatuses[agentId] ?? deriveMemberStatus(fallbackState);
  }

  private updateMemberStatus(agentId: string, status: MemberStatus) {
    this.memberStatuses = {
      ...this.memberStatuses,
      [agentId]: status,
    };
    persistMemberStatuses(this.memberStatuses);
    this.openStatusPickerId = null;
    this.refreshAgentUi();
  }

  private refreshSelectedCitizen() {
    const selected = this.selectedCitizen;
    const snapshot = selected ? this.agents.get(selected.agentId) : undefined;
    for (const citizen of this.citizens) citizen.setSelected(citizen === selected && citizen.room === this.activeRegion);
    this.ui.setSelectedCitizen(
      selected ? this.buildCharacterDetail(selected, snapshot) : null,
      WORLD[this.activeRegion].name,
      WORLD[this.activeRegion].scene.backdrop ?? null
    );
    this.syncCharacterPopup();
  }

  private handleMemberBoardClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const option = target.closest<HTMLButtonElement>('[data-status-option="true"]');
    if (option) {
      event.preventDefault();
      const agentId = option.dataset.agentId;
      const status = option.dataset.statusValue;
      if (agentId === EDITABLE_MEMBER_ID && isMemberStatus(status)) {
        this.updateMemberStatus(agentId, status);
      }
      return;
    }

    const card = target.closest<HTMLElement>('[data-member-card-id]');
    if (card) {
      const agentId = card.dataset.memberCardId;
      if (!agentId) return;

      const citizen = this.citizens.find((entry) => entry.agentId === agentId) ?? null;
      if (citizen) {
        for (const entry of this.citizens) entry.setSelected(false);
        citizen.setSelected(citizen.room === this.activeRegion);
        this.selectedCitizen = citizen;
        this.refreshSelectedCitizen();
        this.applyCameraFocus(citizen.room === this.activeRegion);
      }

      this.openStatusPickerId = agentId === EDITABLE_MEMBER_ID
        ? this.openStatusPickerId === agentId ? null : agentId
        : null;
      this.refreshAgentUi();
      return;
    }

    if (this.openStatusPickerId && !target.closest('[data-member-status-board]')) {
      this.openStatusPickerId = null;
      this.refreshAgentUi();
    }
  }

  private updateSpeakingTargets(citizens: Citizen[]) {
    for (const citizen of citizens) {
      if (citizen.state !== 'speaking') {
        citizen.setSpeakingTarget(null);
        continue;
      }

      const currentTile = citizen.getTilePosition();
      const nearest = citizens
        .filter((entry) => entry.agentId !== citizen.agentId)
        .map((entry) => {
          const tile = entry.getTilePosition();
          return {
            citizen: entry,
            distance: Math.abs(tile.x - currentTile.x) + Math.abs(tile.y - currentTile.y),
            tile,
          };
        })
        .sort((a, b) => a.distance - b.distance)[0];

      citizen.setSpeakingTarget(nearest ? nearest.tile : null);
    }
  }

  private renderExitMarkers(ctx: CanvasRenderingContext2D, _delta: number) {
    const exits = REGION_EXITS[this.activeRegion];
    const projection = getCurrentProjection();
    this.exitHotspots = [];

    exits.forEach((exit, index) => {
      const location = this.scene.getLocation(exit.location);
      if (!location) return;
      const point = projectIso(location.x, location.y, 0, projection);
      const bob = Math.sin(performance.now() / 320 + index * 0.9) * 2.5;
      const markerY = point.y - 26 + bob;
      this.exitHotspots.push({
        ...exit,
        x: point.x,
        y: markerY,
        radius: 16,
      });

      ctx.save();
      ctx.translate(point.x, markerY);
      ctx.fillStyle = 'rgba(17, 14, 26, 0.92)';
      ctx.strokeStyle = hexAlpha(WORLD[exit.region].palette.primary, 0.9);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-24, -15, 48, 18, 8);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 3);
      ctx.lineTo(5, 11);
      ctx.lineTo(-5, 11);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fff7ef';
      ctx.textAlign = 'center';
      ctx.font = '600 8px "Noto Sans SC", sans-serif';
      ctx.fillText(exit.label, 0, -3);
      ctx.fillStyle = hexAlpha(WORLD[exit.region].palette.primary, 0.95);
      ctx.fillText(WORLD[exit.region].shortName, 0, 7);
      ctx.restore();
    });
  }

  private handleHover(event: MouseEvent) {
    const world = this.renderer.screenToWorld(event.clientX, event.clientY);
    const overExit = this.exitHotspots.some((entry) => distanceSq(world.x, world.y, entry.x, entry.y) <= entry.radius * entry.radius);
    const overCitizen = this.citizens.some((citizen) => citizen.visible && citizen.containsPoint(world.x, world.y));
    this.renderer.canvas.style.cursor = overExit || overCitizen ? 'pointer' : 'default';
  }

  private syncCharacterPopup() {
    if (!this.selectedCitizen || this.selectedCitizen.room !== this.activeRegion) {
      this.ui.setCharacterPopup(null);
      return;
    }

    const detail = this.buildCharacterDetail(this.selectedCitizen, this.agents.get(this.selectedCitizen.agentId));
    const anchor = this.selectedCitizen.getScreenAnchor();
    const canvasRect = this.renderer.canvas.getBoundingClientRect();
    const shellRect = this.container.parentElement?.getBoundingClientRect();
    if (!shellRect) return;
    const screen = this.renderer.worldToScreen(anchor.x, anchor.y - 18);
    this.ui.setCharacterPopup({
      detail,
      x: canvasRect.left - shellRect.left + screen.x,
      y: canvasRect.top - shellRect.top + screen.y - 18,
    });
  }

  private buildCharacterDetail(citizen: Citizen, snapshot?: CitizenAgentSnapshot): CharacterDetail {
    const region = normalizeRegion(snapshot?.region ?? citizen.room);
    const memberStatus = this.getMemberStatus(citizen.agentId, citizen.state);
    return {
      id: citizen.agentId,
      name: citizen.name,
      role: labelRole(snapshot?.role ?? citizen.role),
      faction: snapshot?.faction ?? '自由共鸣者',
      status: `${MEMBER_STATUS_LABELS[memberStatus]} · ${labelState(citizen.state)}`,
      room: WORLD[region].name,
      task: snapshot?.task ?? citizen.task ?? '待命中',
      energy: `${Math.round((snapshot?.energy ?? citizen.energy) * 100)}%`,
      avatarPath: citizen.avatarPath,
      cardPath: citizen.cardPath,  // 传递 Card 立绘路径
      activity: describeActivity(citizen.state),
    };
  }

  private applyCameraFocus(preferCitizen: boolean, immediate = false) {
    const zoom = preferCitizen && this.selectedCitizen && this.selectedCitizen.room === this.activeRegion
      ? Math.min(1.18, this.settings.cameraZoom + 0.12)
      : this.settings.cameraZoom;

    if (preferCitizen && this.selectedCitizen && this.selectedCitizen.room === this.activeRegion) {
      const anchor = this.selectedCitizen.getScreenAnchor();
      this.renderer.focusCameraOn(anchor.x, anchor.floorY - 40, zoom, immediate);
      return;
    }

    const focalLocation = this.scene.getLocation(defaultRegionFocus(this.activeRegion));
    if (!focalLocation) return;
    const point = projectIso(focalLocation.x, focalLocation.y, 0, getCurrentProjection());
    this.renderer.focusCameraOn(point.x, point.y + 24, zoom, immediate);
  }

  private seedChatHistory() {
    this.chatHistory = [
      {
        id: 'boot-1',
        speaker: '系统',
        channel: 'system',
        text: '交互系统已加载。点击角色查看资料，点击出口切换地区。',
        mood: 'info',
        meta: '初始化',
      },
      {
        id: 'boot-2',
        speaker: '群聊',
        channel: 'group',
        text: '角色活动会自动同步到沟通面板与画布气泡。',
        mood: 'speaking',
        meta: 'Atelier Feed',
      },
    ];
  }

  private logAgentTransition(previous: CitizenAgentSnapshot | undefined, next: CitizenAgentSnapshot) {
    const signature = this.createAgentSignature(next);
    if (this.agentSignatures.get(next.agent) === signature) return;
    this.agentSignatures.set(next.agent, signature);

    if (!previous) {
      this.appendChat({
        id: `${next.agent}-${Date.now()}`,
        speaker: next.name,
        channel: 'system',
        text: `已进入 ${WORLD[normalizeRegion(next.region ?? next.room)].name}`,
        mood: 'info',
        meta: '上线',
      });
      return;
    }

    this.appendChat({
      id: `${next.agent}-${Date.now()}`,
      speaker: next.name,
      channel: next.state === 'speaking' ? 'group' : 'direct',
      text: next.task ?? describeActivity(normalizeState(next.state)),
      mood: mapMood(normalizeState(next.state)),
      meta: `${labelState(normalizeState(next.state))} · ${WORLD[normalizeRegion(next.region ?? next.room)].shortName}`,
    });
  }

  private logGroupConversation() {
    const speaking = [...this.agents.values()]
      .filter((agent) => normalizeState(agent.state) === 'speaking' && normalizeRegion(agent.region ?? agent.room) === this.activeRegion);
    if (speaking.length < 2) return;

    const signature = speaking.map((agent) => `${agent.agent}:${agent.task ?? ''}`).sort().join('|');
    const lastEntry = this.chatHistory[0];
    if (lastEntry?.id === signature) return;

    this.appendChat({
      id: signature,
      speaker: '群聊',
      channel: 'group',
      text: `${speaking.map((agent) => agent.name).join(' / ')} 正在同步本地区议题`,
      mood: 'speaking',
      meta: `${WORLD[this.activeRegion].shortName} 群聊`,
    });
  }

  private handleSignalEvent(event: { agentId?: string; action?: { type: string; [key: string]: unknown } }) {
    const agentId = event.agentId ?? '';
    const agent = agentId ? this.agents.get(agentId) : undefined;
    const actionLabel = typeof event.action?.type === 'string' ? event.action.type : 'event';
    this.appendChat({
      id: `event-${agentId}-${Date.now()}`,
      speaker: agent?.name ?? '系统',
      channel: 'system',
      text: `收到动作事件：${actionLabel}`,
      mood: 'info',
      meta: 'Signal',
    });
  }

  private appendChat(entry: ChatEntry) {
    this.chatHistory = [entry, ...this.chatHistory].slice(0, 16);
    this.ui.setChatHistory(this.chatHistory);
  }

  private createAgentSignature(agent: CitizenAgentSnapshot) {
    return [
      normalizeState(agent.state),
      agent.task ?? '',
      normalizeRegion(agent.region ?? agent.room),
      Math.round((agent.energy ?? 1) * 100),
    ].join('|');
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

function isMemberStatus(value: unknown): value is MemberStatus {
  return value === 'online' || value === 'idle' || value === 'busy' || value === 'offline';
}

function deriveMemberStatus(state: AgentState): MemberStatus {
  switch (state) {
    case 'working':
    case 'error':
      return 'busy';
    case 'thinking':
      return 'idle';
    case 'sleeping':
    case 'offline':
      return 'offline';
    case 'speaking':
    case 'idle':
    default:
      return 'online';
  }
}

function loadMemberStatuses(): MemberStatusMap {
  try {
    const raw = localStorage.getItem(MEMBER_STATUS_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => isMemberStatus(value))
    ) as MemberStatusMap;
  } catch (error) {
    console.warn('Unable to read member status state.', error);
    return {};
  }
}

function persistMemberStatuses(statuses: MemberStatusMap) {
  try {
    localStorage.setItem(MEMBER_STATUS_STORAGE_KEY, JSON.stringify(statuses));
  } catch (error) {
    console.warn('Unable to persist member status state.', error);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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

function labelRole(role: string): string {
  return {
    owner: '主理人',
    sentinel: '守望者',
    strategist: '策士',
    marshal: '统帅',
    researcher: '研究员',
    curator: '馆藏官',
    designer: '构想师',
    envoy: '特使',
    scout: '侦察员',
    captain: '舰长',
    guest: '访客',
    member: '共鸣者',
  }[role] ?? role;
}

function describeActivity(state: AgentState): string {
  return {
    working: '桌前处理事务',
    idle: '缓慢巡游与观察',
    thinking: '暂停并整理思路',
    sleeping: '低功耗静默',
    speaking: '面向目标交流',
    error: '等待处理异常',
    offline: '未接入同步网',
  }[state];
}

function mapMood(state: AgentState): ChatEntry['mood'] {
  if (state === 'working') return 'working';
  if (state === 'thinking') return 'thinking';
  if (state === 'speaking') return 'speaking';
  if (state === 'error') return 'error';
  return 'info';
}

function defaultRegionFocus(region: RegionId): string {
  return {
    huanglong: 'huanglong_city_center',
    blackshores: 'blackshores_center',
    rinascita: 'rinascita_center',
    frontier: 'frontier_center',
  }[region];
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

function distanceSq(ax: number, ay: number, bx: number, by: number) {
  return (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
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
