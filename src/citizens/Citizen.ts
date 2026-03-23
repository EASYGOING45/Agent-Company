/**
 * 鸣潮元宇宙 - 共鸣者角色
 */

import type { SpriteSheet } from '../sprites/SpriteSheet.ts';
import type { Animator } from '../sprites/Animator.ts';
import type { Pathfinder } from '../scene/Pathfinder.ts';
import type { RenderLayer } from '../canvas/Renderer.ts';

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

  private path: { x: number; y: number }[] = [];
  private pathIndex = 0;
  private moveSpeed = 3.6;
  private moveProgress = 0;
  private tileWidth: number;
  private tileHeight: number;
  private facing: 'up' | 'down' | 'left' | 'right' = 'down';
  private avatarImage: HTMLImageElement | null = null;
  private avatarLoaded = false;

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
    this.loadAvatar();
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

    this.drawAura(ctx);
    if (!this.drawAvatar(ctx)) {
      this.animator.draw(ctx, this.x, this.y);
    }
    this.drawEnergyArc(ctx);
    this.drawNameplate(ctx);
  }

  containsPoint(px: number, py: number): boolean {
    return px >= this.x - 6 && px <= this.x + this.tileWidth + 6 && py >= this.y - 24 && py <= this.y + this.tileHeight;
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

  private loadAvatar() {
    if (!this.avatarPath) return;

    const image = new Image();
    image.onload = () => {
      this.avatarLoaded = true;
      this.avatarImage = image;
    };
    image.onerror = () => {
      this.avatarLoaded = false;
      this.avatarImage = null;
    };
    image.decoding = 'async';
    image.src = this.avatarPath;
    void image.decode?.().catch(() => undefined);
  }

  private drawAura(ctx: CanvasRenderingContext2D) {
    const centerX = this.x + this.tileWidth / 2;
    const baseY = this.y + this.tileHeight - 2;
    const pulse = 0.8 + Math.sin(performance.now() / 380 + this.x * 0.05) * 0.08;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const aura = ctx.createRadialGradient(centerX, baseY, 2, centerX, baseY, 16);
    aura.addColorStop(0, hexToRgba(this.color, 0.34));
    aura.addColorStop(1, hexToRgba(this.color, 0));
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY, 16 * pulse, 7 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawAvatar(ctx: CanvasRenderingContext2D): boolean {
    if (!this.avatarLoaded || !this.avatarImage) return false;

    this.spriteSheet.drawAvatarFallback(ctx, this.avatarImage, this.x, this.y, {
      size: 36,
      borderColor: this.color,
      backgroundColor: 'rgba(8, 12, 28, 0.94)',
    });
    return true;
  }

  private drawEnergyArc(ctx: CanvasRenderingContext2D) {
    const centerX = this.x + this.tileWidth / 2;
    const centerY = this.y + 7;
    const energy = Math.max(0.12, this.energy);

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = hexToRgba(this.color, 0.75);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, -Math.PI * 0.8, -Math.PI * 0.8 + Math.PI * 1.6 * energy);
    ctx.stroke();
    ctx.restore();
  }

  private drawNameplate(ctx: CanvasRenderingContext2D) {
    const centerX = this.x + this.tileWidth / 2 + 10;
    const topY = this.y - 18;
    const statusLabel = STATE_LABEL[this.state];

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '600 10px "Noto Sans SC", sans-serif';
    const nameWidth = ctx.measureText(this.name).width;
    const plateWidth = Math.max(42, nameWidth + 18);

    roundRect(ctx, centerX - plateWidth / 2, topY - 10, plateWidth, 16, 6);
    ctx.fillStyle = 'rgba(5, 8, 20, 0.9)';
    ctx.fill();
    ctx.strokeStyle = `${this.color}80`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#f7fbff';
    ctx.fillText(this.name, centerX, topY + 1);

    ctx.font = '500 8px "Noto Sans SC", sans-serif';
    const statusWidth = Math.max(32, ctx.measureText(statusLabel).width + 20);
    const statusY = topY + 12;

    roundRect(ctx, centerX - statusWidth / 2, statusY - 6, statusWidth, 12, 6);
    ctx.fillStyle = 'rgba(8, 12, 28, 0.88)';
    ctx.fill();
    ctx.strokeStyle = hexToRgba(stateColor(this.state, this.color), 0.55);
    ctx.stroke();

    ctx.fillStyle = stateColor(this.state, this.color);
    ctx.beginPath();
    ctx.arc(centerX - statusWidth / 2 + 7, statusY, 2.5, 0, Math.PI * 2);
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
      .sort((a, b) => (a.y + 32) - (b.y + 32));

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
