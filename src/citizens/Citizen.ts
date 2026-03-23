/**
 * 鸣潮元宇宙 - 共鸣者角色
 * 等距小像素精灵替代高清头像
 */

import type { Animator } from '../sprites/Animator.ts';
import type { RenderLayer } from '../canvas/Renderer.ts';
import { getCurrentProjection, projectIso } from '../canvas/Renderer.ts';
import type { Pathfinder } from '../scene/Pathfinder.ts';
import type { SpriteSheet } from '../sprites/SpriteSheet.ts';

export type AgentState =
  | 'working'
  | 'idle'
  | 'thinking'
  | 'sleeping'
  | 'speaking'
  | 'error'
  | 'offline';

export interface CitizenConfig {
  agentId: string;
  name: string;
  sprite: string;
  position: string;
  avatarPath?: string;
  npc?: boolean;
  color?: string;
  role?: string;
}

export interface MovementContext {
  blockedTiles?: Set<string>;
}

const STATE_ANIMATION_MAP: Record<AgentState, string> = {
  working: 'working',
  idle: 'idle_down',
  thinking: 'idle_up',
  sleeping: 'sleeping',
  speaking: 'talking',
  error: 'idle_left',
  offline: 'idle_down',
};

const STATE_LABEL: Record<AgentState, string> = {
  working: '工作中',
  idle: '待命',
  thinking: '思考',
  sleeping: '休眠',
  speaking: '交流',
  error: '异常',
  offline: '离线',
};

export class Citizen {
  readonly agentId: string;
  readonly name: string;
  readonly animator: Animator;
  readonly spriteSheet: SpriteSheet;
  readonly color: string;
  readonly role: string;
  readonly avatarPath: string | null;

  x = 0;
  y = 0;
  state: AgentState = 'idle';
  task: string | null = null;
  energy = 1;
  visible = true;
  room = 'rinascita';
  anchorLocation = '';
  currentTargetLocation: string | null = null;
  selected = false;

  private path: { x: number; y: number }[] = [];
  private pathIndex = 0;
  private moveSpeed = 3.6;
  private moveProgress = 0;
  private tileWidth: number;
  private tileHeight: number;
  private facing: 'up' | 'down' | 'left' | 'right' = 'down';

  constructor(config: CitizenConfig, spriteSheet: SpriteSheet, tileWidth: number, tileHeight: number) {
    this.agentId = config.agentId;
    this.name = config.name;
    this.spriteSheet = spriteSheet;
    this.animator = spriteSheet.createAnimator();
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.color = config.color ?? '#64d5ff';
    this.role = config.role ?? 'member';
    this.avatarPath = config.avatarPath ?? null;
    this.anchorLocation = config.position;
    this.room = inferRoomId(config.position);
    this.animator.play('idle_down');
  }

  setRoom(room: string) {
    this.room = room;
  }

  setTilePosition(tileX: number, tileY: number) {
    this.x = tileX * this.tileWidth;
    this.y = tileY * this.tileHeight;
    this.path = [];
    this.pathIndex = 0;
    this.moveProgress = 0;
  }

  getTilePosition() {
    return {
      x: Math.round(this.x / this.tileWidth),
      y: Math.round(this.y / this.tileHeight),
    };
  }

  getProjectedPosition() {
    const tileX = this.x / this.tileWidth;
    const tileY = this.y / this.tileHeight;
    return projectIso(tileX, tileY, 0, getCurrentProjection());
  }

  getScreenAnchor() {
    const point = this.getProjectedPosition();
    return {
      x: point.x,
      y: point.y - 22,
      floorY: point.y + getCurrentProjection().tileHeight * 0.65,
    };
  }

  getReservedTiles(): string[] {
    const reservations = [`${this.getTilePosition().x},${this.getTilePosition().y}`];
    const next = this.path[this.pathIndex];
    if (next) {
      reservations.push(`${next.x},${next.y}`);
    }
    return reservations;
  }

  walkTo(path: { x: number; y: number }[], targetLocation?: string | null) {
    if (path.length <= 1) {
      this.currentTargetLocation = targetLocation ?? this.currentTargetLocation;
      return;
    }
    this.path = path;
    this.pathIndex = 1;
    this.moveProgress = 0;
    this.currentTargetLocation = targetLocation ?? this.currentTargetLocation;
  }

  clearTarget() {
    this.path = [];
    this.pathIndex = 0;
    this.moveProgress = 0;
    this.currentTargetLocation = null;
  }

  isMoving(): boolean {
    return this.pathIndex > 0 && this.pathIndex < this.path.length;
  }

  updateState(newState: AgentState, task?: string | null, energy?: number, room?: string) {
    const prevState = this.state;
    this.state = newState;
    if (task !== undefined) this.task = task;
    if (energy !== undefined) this.energy = energy;
    if (room) this.room = room;
    this.visible = newState !== 'offline';

    if (prevState !== newState && !this.isMoving()) {
      this.playIdleAnimation();
    }
  }

  update(delta: number, pathfinder: Pathfinder, context: MovementContext = {}) {
    if (this.isMoving()) {
      this.updateMovement(delta, pathfinder, context);
    } else {
      this.playIdleAnimation();
    }

    this.animator.update(delta);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.visible) return;
    const anchor = this.getScreenAnchor();
    this.drawFloorShadow(ctx, anchor.x, anchor.floorY);
    this.drawAura(ctx, anchor.x, anchor.floorY);
    this.drawSprite(ctx, anchor.x, anchor.y);
    this.drawEnergyArc(ctx, anchor.x, anchor.y);
    this.drawNameplate(ctx, anchor.x, anchor.y - 22);
  }

  containsPoint(px: number, py: number): boolean {
    const anchor = this.getScreenAnchor();
    return px >= anchor.x - 18 && px <= anchor.x + 18 && py >= anchor.y - 28 && py <= anchor.floorY + 4;
  }

  private updateMovement(delta: number, _pathfinder: Pathfinder, context: MovementContext) {
    if (this.pathIndex >= this.path.length) return;

    const target = this.path[this.pathIndex];
    const previous = this.path[this.pathIndex - 1];
    const targetKey = `${target.x},${target.y}`;
    const currentKey = `${previous.x},${previous.y}`;
    if (context.blockedTiles?.has(targetKey) && targetKey !== currentKey) {
      this.playWalkAnimation(target.x - previous.x, target.y - previous.y);
      return;
    }

    this.playWalkAnimation(target.x - previous.x, target.y - previous.y);
    this.moveProgress = Math.min(1, this.moveProgress + delta * this.moveSpeed);

    const eased = easeInOut(this.moveProgress);
    const startX = previous.x * this.tileWidth;
    const startY = previous.y * this.tileHeight;
    const targetX = target.x * this.tileWidth;
    const targetY = target.y * this.tileHeight;
    this.x = startX + (targetX - startX) * eased;
    this.y = startY + (targetY - startY) * eased;

    if (this.moveProgress >= 1) {
      this.x = targetX;
      this.y = targetY;
      this.moveProgress = 0;
      this.pathIndex += 1;
      if (this.pathIndex >= this.path.length) {
        this.path = [];
        this.pathIndex = 0;
        this.playIdleAnimation();
      }
    }
  }

  private playWalkAnimation(dx: number, dy: number) {
    if (Math.abs(dx) > Math.abs(dy)) {
      this.facing = dx > 0 ? 'right' : 'left';
    } else if (dy !== 0) {
      this.facing = dy > 0 ? 'down' : 'up';
    }
    this.animator.play(`walk_${this.facing}`);
  }

  private playIdleAnimation() {
    const mapped = STATE_ANIMATION_MAP[this.state];
    if (mapped.startsWith('idle_')) {
      this.animator.play(`idle_${this.facing}`);
      return;
    }
    this.animator.play(mapped);
  }

  setSelected(selected: boolean) {
    this.selected = selected;
  }

  private drawFloorShadow(ctx: CanvasRenderingContext2D, centerX: number, floorY: number) {
    ctx.save();
    ctx.fillStyle = this.selected ? 'rgba(4, 8, 18, 0.58)' : 'rgba(4, 8, 18, 0.42)';
    ctx.beginPath();
    ctx.ellipse(centerX + 1, floorY + 2, this.selected ? 17 : 13, this.selected ? 7 : 5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (this.selected) {
      ctx.strokeStyle = hexToRgba(this.color, 0.65);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(centerX, floorY, 17, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawAura(ctx: CanvasRenderingContext2D, centerX: number, floorY: number) {
    const intensity = this.selected ? 1.4 : this.state === 'working' || this.state === 'speaking' ? 1.12 : 0.92;
    const pulse = (0.86 + Math.sin(performance.now() / 380 + this.x * 0.05) * 0.06) * intensity;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const aura = ctx.createRadialGradient(centerX, floorY, 2, centerX, floorY, this.selected ? 24 : 18);
    aura.addColorStop(0, hexToRgba(this.color, this.selected ? 0.42 : 0.28));
    aura.addColorStop(1, hexToRgba(this.color, 0));
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(centerX, floorY, 16 * pulse, 7 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawSprite(ctx: CanvasRenderingContext2D, centerX: number, baseY: number) {
    ctx.save();
    ctx.translate(centerX - 16, baseY - 24);
    this.animator.draw(ctx, 0, 0);
    ctx.restore();
  }

  private drawEnergyArc(ctx: CanvasRenderingContext2D, centerX: number, baseY: number) {
    const energy = Math.max(0.12, this.energy);
    ctx.save();
    ctx.lineWidth = this.selected ? 2.5 : 2;
    ctx.strokeStyle = hexToRgba(this.color, this.selected ? 0.92 : 0.7);
    ctx.beginPath();
    ctx.arc(centerX, baseY - 18, 11, -Math.PI * 0.8, -Math.PI * 0.8 + Math.PI * 1.6 * energy);
    ctx.stroke();
    ctx.restore();
  }

  private drawNameplate(ctx: CanvasRenderingContext2D, centerX: number, topY: number) {
    const statusLabel = STATE_LABEL[this.state];
    const roleLabel = ROLE_LABEL[this.role] ?? 'AGENT';
    const roomLabel = ROOM_LABEL[this.room] ?? this.room.toUpperCase();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '600 10px "Noto Sans SC", sans-serif';
    const nameWidth = ctx.measureText(this.name).width;
    const roleWidth = Math.max(26, ctx.measureText(roleLabel).width + 10);
    const roomWidth = Math.max(34, ctx.measureText(roomLabel).width + 10);
    const plateWidth = Math.max(58, nameWidth + roleWidth + roomWidth + 28);
    const plateX = centerX - plateWidth / 2;

    roundRect(ctx, plateX, topY - 11, plateWidth, 16, 6);
    ctx.fillStyle = this.selected ? 'rgba(22, 18, 28, 0.98)' : 'rgba(18, 14, 22, 0.92)';
    ctx.fill();
    ctx.strokeStyle = `${this.color}${this.selected ? 'aa' : '66'}`;
    ctx.lineWidth = 1;
    ctx.stroke();

    roundRect(ctx, plateX + 4, topY - 8, roleWidth, 10, 4);
    ctx.fillStyle = hexToRgba(this.color, 0.2);
    ctx.fill();
    ctx.fillStyle = '#fff6e5';
    ctx.font = '700 7px "Noto Sans SC", sans-serif';
    ctx.fillText(roleLabel, plateX + 4 + roleWidth / 2, topY);

    ctx.font = '600 10px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#fff7ef';
    ctx.fillText(this.name, centerX, topY + 1.5);

    roundRect(ctx, plateX + plateWidth - roomWidth - 4, topY - 8, roomWidth, 10, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.fillStyle = stateColor(this.state, this.color);
    ctx.font = '700 7px "Noto Sans SC", sans-serif';
    ctx.fillText(roomLabel, plateX + plateWidth - roomWidth / 2 - 4, topY);

    ctx.font = '500 8px "Noto Sans SC", sans-serif';
    const statusWidth = Math.max(28, ctx.measureText(statusLabel).width + 18);
    const statusY = topY + 13;
    roundRect(ctx, centerX - statusWidth / 2, statusY - 5, statusWidth, 11, 5);
    ctx.fillStyle = 'rgba(29, 22, 28, 0.88)';
    ctx.fill();
    ctx.strokeStyle = hexToRgba(stateColor(this.state, this.color), 0.5);
    ctx.stroke();
    ctx.fillStyle = stateColor(this.state, this.color);
    ctx.beginPath();
    ctx.arc(centerX - statusWidth / 2 + 6, statusY + 0.5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(statusLabel, centerX + 3, statusY + 3);
    ctx.restore();
  }
}

export class CitizenLayer implements RenderLayer {
  readonly order = 10;
  private citizens: Citizen[] = [];

  setCitizens(citizens: Citizen[]) {
    this.citizens = citizens;
  }

  render(ctx: CanvasRenderingContext2D, _delta: number) {
    const sorted = this.citizens
      .filter((citizen) => citizen.visible)
      .sort((a, b) => {
        const aAnchor = a.getScreenAnchor();
        const bAnchor = b.getScreenAnchor();
        return aAnchor.floorY - bAnchor.floorY;
      });

    for (const citizen of sorted) {
      citizen.draw(ctx);
    }
  }
}

function inferRoomId(location: string): string {
  if (location.startsWith('huanglong_')) return 'huanglong';
  if (location.startsWith('blackshores_')) return 'blackshores';
  if (location.startsWith('rinascita_')) return 'rinascita';
  return 'frontier';
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'OWNER',
  sentinel: 'SEN',
  strategist: 'STR',
  marshal: 'MAR',
  researcher: 'LAB',
  curator: 'CUR',
  scout: 'SCT',
  captain: 'CAP',
  guest: 'GST',
  member: 'AGENT',
};

const ROOM_LABEL: Record<string, string> = {
  huanglong: '瑝珑',
  blackshores: '黑海岸',
  rinascita: '黎那汐塔',
  frontier: '北落野',
};

function easeInOut(value: number): number {
  return value * value * (3 - 2 * value);
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const int = Number.parseInt(value, 16);
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
}

function stateColor(state: AgentState, fallback: string): string {
  switch (state) {
    case 'working':
      return '#8ce8b7';
    case 'thinking':
      return '#8ec8ff';
    case 'speaking':
      return '#ffd37c';
    case 'sleeping':
      return '#c7b0ff';
    case 'error':
      return '#ff8f8f';
    case 'offline':
      return '#7f8aa8';
    default:
      return fallback;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}
