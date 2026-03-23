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
    const canvasX = (screenX - rect.left) / this.scale;
    const canvasY = (screenY - rect.top) / this.scale;
    return this.camera.screenToWorld(canvasX, canvasY);
  }

  private render(delta: number) {
    const { ctx, canvas } = this;
    this.crtPhase += delta;
    setCurrentProjection(buildProjection(canvas.width, canvas.height, 16, 12));

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#040816';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.camera.update();
    this.camera.apply(ctx);

    for (const layer of this.layers) {
      ctx.save();
      layer.render(ctx, delta);
      ctx.restore();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.drawCrtOverlay(ctx, canvas.width, canvas.height);
  }

  private drawCrtOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
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
    ctx.restore();
  }
}
