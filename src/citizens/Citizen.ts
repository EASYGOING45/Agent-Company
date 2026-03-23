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

export class Citizen {
  readonly agentId: string;
  readonly name: string;
  readonly animator: Animator;
  readonly spriteSheet: SpriteSheet;
  readonly color: string;
  readonly role: string;

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

  constructor(config: CitizenConfig, spriteSheet: SpriteSheet, tileWidth: number, tileHeight: number) {
    this.agentId = config.agentId;
    this.name = config.name;
    this.spriteSheet = spriteSheet;
    this.animator = spriteSheet.createAnimator();
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.color = config.color ?? '#64d5ff';
    this.role = config.role ?? 'member';
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

    this.animator.draw(ctx, this.x, this.y);

    ctx.save();
    ctx.font = '10px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    const tagX = this.x + this.tileWidth / 2;
    const tagY = this.y - 10;
    const nameWidth = ctx.measureText(this.name).width;

    ctx.fillStyle = 'rgba(7, 12, 26, 0.8)';
    ctx.strokeStyle = `${this.color}66`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tagX - nameWidth / 2 - 6, tagY - 11, nameWidth + 12, 16, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.color;
    ctx.fillText(this.name, tagX, tagY);
    ctx.restore();
  }

  containsPoint(px: number, py: number): boolean {
    return px >= this.x && px <= this.x + this.tileWidth && py >= this.y && py <= this.y + this.tileHeight;
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
