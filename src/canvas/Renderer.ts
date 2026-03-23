/**
 * 鸣潮元宇宙 - Canvas 渲染引擎
 */

import { Camera } from './Camera.ts';

export interface RenderLayer {
  order: number;
  render(ctx: CanvasRenderingContext2D, delta: number): void;
}

export interface IsometricProjection {
  originX: number;
  originY: number;
  tileWidth: number;
  tileHeight: number;
  elevation: number;
  mapWidth: number;
  mapHeight: number;
}

const DEFAULT_TILE_WIDTH = 48;
const DEFAULT_TILE_HEIGHT = 24;
const DEFAULT_ELEVATION = 34;

let currentProjection: IsometricProjection = {
  originX: 256,
  originY: 74,
  tileWidth: DEFAULT_TILE_WIDTH,
  tileHeight: DEFAULT_TILE_HEIGHT,
  elevation: DEFAULT_ELEVATION,
  mapWidth: 16,
  mapHeight: 12,
};

export function setCurrentProjection(projection: Partial<IsometricProjection>) {
  currentProjection = { ...currentProjection, ...projection };
}

export function getCurrentProjection(): IsometricProjection {
  return currentProjection;
}

export function buildProjection(
  canvasWidth: number,
  _canvasHeight: number,
  mapWidth: number,
  mapHeight: number,
  tileWidth = DEFAULT_TILE_WIDTH,
  tileHeight = DEFAULT_TILE_HEIGHT,
  elevation = DEFAULT_ELEVATION
): IsometricProjection {
  const span = (mapWidth + mapHeight) * (tileWidth / 2);
  return {
    originX: Math.round((canvasWidth - span) / 2 + mapHeight * (tileWidth / 2)),
    originY: 70,
    tileWidth,
    tileHeight,
    elevation,
    mapWidth,
    mapHeight,
  };
}

export function projectIso(tileX: number, tileY: number, lift = 0, projection = currentProjection) {
  const halfW = projection.tileWidth / 2;
  const halfH = projection.tileHeight / 2;
  return {
    x: projection.originX + (tileX - tileY) * halfW,
    y: projection.originY + (tileX + tileY) * halfH - lift,
  };
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly camera: Camera;

  private layers: RenderLayer[] = [];
  private animationId: number | null = null;
  private lastTime = 0;
  private scale: number;
  private crtPhase = 0;
  private ambientFx = true;
  private transitionAmount = 0;
  private transitionLabel = '';

  constructor(container: HTMLElement, width: number, height: number, scale = 2) {
    this.scale = scale;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.imageRendering = 'pixelated';
    this.canvas.style.width = `${width * scale}px`;
    this.canvas.style.height = `${height * scale}px`;
    this.canvas.style.borderRadius = '14px';
    this.canvas.style.boxShadow = '0 24px 80px rgba(37, 111, 181, 0.35)';

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取 2D 上下文');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;

    this.camera = new Camera();
    container.appendChild(this.canvas);
  }

  addLayer(layer: RenderLayer) {
    this.layers.push(layer);
    this.layers.sort((a, b) => a.order - b.order);
  }

  start() {
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const delta = Math.min(0.05, (time - this.lastTime) / 1000);
      this.lastTime = time;
      this.render(delta);
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width * this.scale}px`;
    this.canvas.style.height = `${height * this.scale}px`;
    this.ctx.imageSmoothingEnabled = false;
  }

  getScale(): number {
    return this.scale;
  }

  screenToWorld(screenX: number, screenY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = ((screenX - rect.left) / rect.width) * this.canvas.width;
    const canvasY = ((screenY - rect.top) / rect.height) * this.canvas.height;
    return this.camera.screenToWorld(canvasX, canvasY);
  }

  worldToScreen(worldX: number, worldY: number) {
    const point = this.camera.worldToScreen(worldX, worldY);
    return {
      x: point.x * this.scale,
      y: point.y * this.scale,
    };
  }

  focusCameraOn(worldX: number, worldY: number, zoom = this.camera.zoom, immediate = false) {
    this.camera.focusOn(worldX, worldY, this.canvas.width, this.canvas.height, zoom, immediate);
  }

  setAmbientFx(enabled: boolean) {
    this.ambientFx = enabled;
  }

  async playTransition(label: string, job: () => Promise<void> | void) {
    this.transitionLabel = label;
    await this.tweenTransition(1);
    await job();
    await this.tweenTransition(0);
    this.transitionLabel = '';
  }

  private render(delta: number) {
    const { ctx, canvas } = this;
    this.crtPhase += delta;
    setCurrentProjection(buildProjection(canvas.width, canvas.height, 16, 12));

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#040816';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.drawAmbientBackdrop(ctx, canvas.width, canvas.height);

    this.camera.update(delta);
    this.camera.apply(ctx);

    for (const layer of this.layers) {
      ctx.save();
      layer.render(ctx, delta);
      ctx.restore();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.drawCrtOverlay(ctx, canvas.width, canvas.height);
    this.drawTransitionOverlay(ctx, canvas.width, canvas.height);
  }

  private drawAmbientBackdrop(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.ambientFx) return;
    const topGlow = ctx.createRadialGradient(width * 0.18, height * 0.08, 12, width * 0.18, height * 0.08, width * 0.42);
    topGlow.addColorStop(0, 'rgba(255, 210, 128, 0.08)');
    topGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, width, height);

    const sideGlow = ctx.createRadialGradient(width * 0.82, height * 0.22, 12, width * 0.82, height * 0.22, width * 0.36);
    sideGlow.addColorStop(0, 'rgba(108, 210, 255, 0.08)');
    sideGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sideGlow;
    ctx.fillRect(0, 0, width, height);
  }

  private drawCrtOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.ambientFx) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let y = 0; y < height; y += 3) {
      const alpha = 0.018 + (Math.sin(this.crtPhase * 3 + y * 0.12) + 1) * 0.01;
      ctx.fillStyle = `rgba(120, 210, 255, ${alpha.toFixed(3)})`;
      ctx.fillRect(0, y, width, 1);
    }

    const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.2, width / 2, height / 2, height * 0.8);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 8, 20, 0.45)');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    const frameGlow = ctx.createLinearGradient(0, 0, width, height);
    frameGlow.addColorStop(0, 'rgba(243, 197, 107, 0.16)');
    frameGlow.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
    frameGlow.addColorStop(1, 'rgba(100, 213, 255, 0.16)');
    ctx.strokeStyle = frameGlow;
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, width - 3, height - 3);
    ctx.restore();
  }

  private drawTransitionOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (this.transitionAmount <= 0.001) return;
    ctx.save();
    const eased = easeOutCubic(this.transitionAmount);
    const overlay = ctx.createLinearGradient(0, 0, width, height);
    overlay.addColorStop(0, `rgba(16, 9, 18, ${(0.46 * eased).toFixed(3)})`);
    overlay.addColorStop(1, `rgba(7, 10, 18, ${(0.82 * eased).toFixed(3)})`);
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = `rgba(243, 197, 107, ${(0.65 * eased).toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    if (this.transitionLabel) {
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255, 245, 233, ${(0.92 * eased).toFixed(3)})`;
      ctx.font = '700 12px "Noto Sans SC", sans-serif';
      ctx.fillText(`正在前往 ${this.transitionLabel}`, width / 2, height / 2 - 4);
      ctx.font = '500 10px "Noto Sans SC", sans-serif';
      ctx.fillStyle = `rgba(216, 210, 226, ${(0.78 * eased).toFixed(3)})`;
      ctx.fillText('Room transition engaged', width / 2, height / 2 + 16);
    }
    ctx.restore();
  }

  private tweenTransition(target: number, duration = 220) {
    const start = this.transitionAmount;
    const delta = target - start;
    if (Math.abs(delta) < 0.001) {
      this.transitionAmount = target;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const startTime = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = easeInOutCubic(progress);
        this.transitionAmount = start + delta * eased;
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          this.transitionAmount = target;
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
  }
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}
