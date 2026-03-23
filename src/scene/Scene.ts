/**
 * 鸣潮元宇宙 - 等距场景系统
 * Miniverse 风格的室内像素房间
 */

import { Pathfinder } from './Pathfinder.ts';
import {
  buildProjection,
  projectIso,
  setCurrentProjection,
  type IsometricProjection,
  type RenderLayer,
} from '../canvas/Renderer.ts';

export const DEADSPACE = '';

export interface NamedLocation {
  x: number;
  y: number;
  label: string;
}

export interface SceneConfig {
  name: string;
  tileWidth: number;
  tileHeight: number;
  layers: string[][][];
  walkable: boolean[][];
  locations: Record<string, NamedLocation>;
  tiles: Record<string, string>;
  theme?: 'blue' | 'green' | 'warm' | 'purple';
  backdrop?: string;
  backdropPosition?: string;
}

interface RenderCommand {
  depth: number;
  draw: () => void;
}

const THEME_TINT: Record<NonNullable<SceneConfig['theme']>, string> = {
  blue: '#64d5ff',
  green: '#87f0c7',
  warm: '#f3c56b',
  purple: '#b59bff',
};

export class Scene implements RenderLayer {
  readonly order = 0;
  config: SceneConfig;
  pathfinder: Pathfinder;
  private tileImages: Map<string, HTMLImageElement> = new Map();
  private backdropImage: HTMLImageElement | null = null;
  private loaded = false;

  constructor(config: SceneConfig) {
    this.config = config;
    this.pathfinder = new Pathfinder(config.walkable);
  }

  async load(basePath = ''): Promise<void> {
    this.tileImages.clear();
    this.backdropImage = null;
    const entries = Object.entries(this.config.tiles);
    const promises = entries.map(([key, src]) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.tileImages.set(key, img);
          resolve();
        };
        img.onerror = () => resolve();
        const isAbsolute = /^(\/|blob:|data:|https?:\/\/)/.test(src);
        img.src = isAbsolute ? src : `${basePath}/${src}`;
      })
    );

    if (this.config.backdrop) {
      promises.push(
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            this.backdropImage = img;
            resolve();
          };
          img.onerror = () => resolve();
          const src = this.config.backdrop ?? '';
          const isAbsolute = /^(\/|blob:|data:|https?:\/\/)/.test(src);
          img.src = isAbsolute ? src : `${basePath}/${src}`;
        })
      );
    }

    await Promise.all(promises);
    this.loaded = true;
  }

  async setConfig(config: SceneConfig): Promise<void> {
    this.config = config;
    this.pathfinder = new Pathfinder(config.walkable);
    await this.load();
  }

  getLocation(name: string): NamedLocation | undefined {
    return this.config.locations[name];
  }

  render(ctx: CanvasRenderingContext2D, _delta: number) {
    const cols = this.config.walkable[0].length;
    const rows = this.config.walkable.length;
    const projection = buildProjection(ctx.canvas.width, ctx.canvas.height, cols, rows);
    setCurrentProjection(projection);

    ctx.fillStyle = '#120f16';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.drawBackdrop(ctx, projection);
    this.drawAtmosphere(ctx, projection);

    const commands: RenderCommand[] = [];
    const { layers } = this.config;
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
      const layer = layers[layerIndex];
      for (let row = 0; row < layer.length; row += 1) {
        for (let col = 0; col < layer[row].length; col += 1) {
          const key = layer[row][col];
          if (key === DEADSPACE) continue;
          commands.push(...this.buildTileCommands(ctx, key, col, row, layerIndex, projection));
        }
      }
    }

    commands.sort((a, b) => a.depth - b.depth);
    for (const command of commands) {
      command.draw();
    }
  }

  private buildTileCommands(
    ctx: CanvasRenderingContext2D,
    key: string,
    col: number,
    row: number,
    layerIndex: number,
    projection: IsometricProjection
  ): RenderCommand[] {
    const commands: RenderCommand[] = [];
    const tint = THEME_TINT[this.config.theme ?? 'blue'];
    const anchor = projectIso(col, row, 0, projection);
    const baseDepth = row * 100 + col * 10 + layerIndex;

    if (key.startsWith('wall')) {
      commands.push({
        depth: baseDepth + 1,
        draw: () => this.drawWallBlock(ctx, anchor.x, anchor.y, key, tint, projection),
      });
      return commands;
    }

    commands.push({
      depth: baseDepth,
      draw: () => this.drawFloorDiamond(ctx, anchor.x, anchor.y, key, tint, projection),
    });

    if (key.startsWith('floor') || key === 'window') {
      if (key === 'window') {
        commands.push({
          depth: baseDepth + 2,
          draw: () => this.drawWindow(ctx, anchor.x, anchor.y, tint, projection),
        });
      }
      return commands;
    }

    commands.push({
      depth: baseDepth + 5,
      draw: () => this.drawPropShadow(ctx, anchor.x, anchor.y, projection),
    });
    commands.push({
      depth: baseDepth + 6,
      draw: () => this.drawProp(ctx, anchor.x, anchor.y, key, tint, projection),
    });
    return commands;
  }

  private drawBackdrop(ctx: CanvasRenderingContext2D, projection: IsometricProjection) {
    ctx.save();
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, 'rgba(17, 12, 22, 0.98)');
    gradient.addColorStop(1, 'rgba(10, 8, 16, 0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (this.backdropImage) {
      const source = cropBackdrop(this.backdropImage, ctx.canvas.width, ctx.canvas.height, this.config.backdropPosition ?? 'center');
      ctx.globalAlpha = 0.18;
      ctx.filter = 'blur(1px) saturate(0.8)';
      ctx.drawImage(this.backdropImage, source.sx, source.sy, source.sw, source.sh, 0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.filter = 'none';
    }

    const roomBack = projectIso(0, 0, -projection.elevation * 0.1, projection);
    const roomLeft = projectIso(0, projection.mapHeight - 1, 0, projection);
    const roomRight = projectIso(projection.mapWidth - 1, 0, 0, projection);

    ctx.fillStyle = 'rgba(18, 14, 20, 0.96)';
    ctx.beginPath();
    ctx.moveTo(roomBack.x, roomBack.y - projection.elevation * 1.45);
    ctx.lineTo(roomLeft.x, roomLeft.y - projection.elevation * 0.8);
    ctx.lineTo(roomLeft.x, roomLeft.y + projection.tileHeight * 2.2);
    ctx.lineTo(roomBack.x, roomBack.y + projection.tileHeight * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(roomBack.x, roomBack.y - projection.elevation * 1.45);
    ctx.lineTo(roomRight.x, roomRight.y - projection.elevation * 0.8);
    ctx.lineTo(roomRight.x, roomRight.y + projection.tileHeight * 2.2);
    ctx.lineTo(roomBack.x, roomBack.y + projection.tileHeight * 0.6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(27, 21, 31, 0.96)';
    ctx.fill();
    ctx.restore();
  }

  private drawAtmosphere(ctx: CanvasRenderingContext2D, projection: IsometricProjection) {
    const tint = THEME_TINT[this.config.theme ?? 'blue'];
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(
      projection.originX,
      projection.originY + projection.tileHeight * 4,
      16,
      projection.originX,
      projection.originY + projection.tileHeight * 4,
      projection.tileWidth * 8
    );
    glow.addColorStop(0, `${tint}22`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let i = 0; i < 5; i += 1) {
      ctx.strokeStyle = `${tint}${(18 - i * 2).toString(16).padStart(2, '0')}`;
      ctx.beginPath();
      ctx.moveTo(projection.originX - 220 + i * 38, projection.originY + 10);
      ctx.lineTo(projection.originX + 30 + i * 42, projection.originY + 150);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawFloorDiamond(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    key: string,
    tint: string,
    projection: IsometricProjection
  ) {
    const palette = floorPalette(key, tint);
    const halfW = projection.tileWidth / 2;
    const halfH = projection.tileHeight / 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + halfW, y + halfH);
    ctx.lineTo(x, y + projection.tileHeight);
    ctx.lineTo(x - halfW, y + halfH);
    ctx.closePath();
    ctx.fillStyle = palette.base;
    ctx.fill();

    ctx.strokeStyle = palette.line;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x + halfW - 2, y + halfH);
    ctx.lineTo(x, y + projection.tileHeight - 3);
    ctx.strokeStyle = palette.highlight;
    ctx.stroke();

    drawFloorPattern(ctx, key, x, y, projection, palette);
    ctx.restore();
  }

  private drawWallBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    key: string,
    tint: string,
    projection: IsometricProjection
  ) {
    const palette = wallColors(key, tint);
    const halfW = projection.tileWidth / 2;
    const top = y - projection.elevation;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + halfW, top + projection.tileHeight / 2);
    ctx.lineTo(x, top + projection.tileHeight);
    ctx.lineTo(x - halfW, top + projection.tileHeight / 2);
    ctx.closePath();
    ctx.fillStyle = palette.top;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - halfW, top + projection.tileHeight / 2);
    ctx.lineTo(x, top + projection.tileHeight);
    ctx.lineTo(x, y + projection.tileHeight / 2);
    ctx.lineTo(x - halfW, y);
    ctx.closePath();
    ctx.fillStyle = palette.left;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + halfW, top + projection.tileHeight / 2);
    ctx.lineTo(x, top + projection.tileHeight);
    ctx.lineTo(x, y + projection.tileHeight / 2);
    ctx.lineTo(x + halfW, y);
    ctx.closePath();
    ctx.fillStyle = palette.right;
    ctx.fill();

    ctx.strokeStyle = palette.line;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + halfW, top + projection.tileHeight / 2);
    ctx.lineTo(x, top + projection.tileHeight);
    ctx.lineTo(x - halfW, top + projection.tileHeight / 2);
    ctx.closePath();
    ctx.stroke();
    drawWallPattern(ctx, x, y, projection, palette);
    ctx.restore();
  }

  private drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, tint: string, projection: IsometricProjection) {
    ctx.save();
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = 'rgba(196, 232, 255, 0.18)';
    ctx.beginPath();
    ctx.moveTo(x, y - projection.elevation * 0.92);
    ctx.lineTo(x + 12, y - projection.elevation * 0.78);
    ctx.lineTo(x, y - projection.elevation * 0.58);
    ctx.lineTo(x - 12, y - projection.elevation * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `${tint}88`;
    ctx.stroke();
    ctx.restore();
  }

  private drawPropShadow(ctx: CanvasRenderingContext2D, x: number, y: number, projection: IsometricProjection) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 2, 6, 0.32)';
    ctx.beginPath();
    ctx.ellipse(x, y + projection.tileHeight * 0.8, projection.tileWidth * 0.22, projection.tileHeight * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawProp(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    key: string,
    tint: string,
    projection: IsometricProjection
  ) {
    const halfW = projection.tileWidth / 2;
    const top = y - 10;

    ctx.save();
    switch (key) {
      case 'desk':
      case 'console':
      case 'table':
      case 'bar':
        drawIsoBox(ctx, x, top, halfW - 5, 10, 18, key === 'bar' ? ['#7e5b3b', '#5b3f27', '#906845'] : ['#394d72', '#26354d', '#4a638f']);
        if (key !== 'bar') {
          ctx.fillStyle = `${tint}66`;
          ctx.fillRect(x - 10, top + 8, 20, 2);
        }
        break;
      case 'chair':
      case 'bench':
      case 'couch':
        drawIsoBox(ctx, x, top + 6, halfW - 10, 8, key === 'couch' ? 14 : 10, key === 'couch' ? ['#9a6a57', '#68473a', '#b67d67'] : ['#566c8f', '#364760', '#6f86ab']);
        break;
      case 'bookshelf':
      case 'archive':
      case 'shelf':
        drawTallCabinet(ctx, x, y - 8, key === 'archive' ? ['#705470', '#4c364c', '#8a6a8f'] : ['#73573f', '#4f3926', '#957154'], projection);
        break;
      case 'plant':
        drawPlant(ctx, x, y - 2, projection);
        break;
      case 'lamp':
        drawLamp(ctx, x, y - 4, projection, tint);
        break;
      case 'board':
      case 'holo':
        drawBoard(ctx, x, y - 18, key === 'holo' ? tint : '#f3c56b');
        break;
      case 'divider':
      case 'pillar':
      case 'pod':
        drawTallCabinet(ctx, x, y - 6, ['#46506a', '#2f3648', '#5a6788'], projection);
        break;
      case 'crate':
        drawIsoBox(ctx, x, top + 8, halfW - 11, 7, 10, ['#7c5c37', '#593f24', '#9c7852']);
        break;
      default:
        drawIsoBox(ctx, x, top, halfW - 10, 8, 10, ['#42506f', '#2e394f', '#566586']);
        break;
    }
    ctx.restore();
  }
}

function drawIsoBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  halfWidth: number,
  halfDepth: number,
  height: number,
  colors: [string, string, string]
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + halfWidth, y + halfDepth);
  ctx.lineTo(x, y + halfDepth * 2);
  ctx.lineTo(x - halfWidth, y + halfDepth);
  ctx.closePath();
  ctx.fillStyle = colors[2];
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - halfWidth, y + halfDepth);
  ctx.lineTo(x, y + halfDepth * 2);
  ctx.lineTo(x, y + halfDepth * 2 + height);
  ctx.lineTo(x - halfWidth, y + halfDepth + height);
  ctx.closePath();
  ctx.fillStyle = colors[1];
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + halfWidth, y + halfDepth);
  ctx.lineTo(x, y + halfDepth * 2);
  ctx.lineTo(x, y + halfDepth * 2 + height);
  ctx.lineTo(x + halfWidth, y + halfDepth + height);
  ctx.closePath();
  ctx.fillStyle = colors[0];
  ctx.fill();
}

function drawTallCabinet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colors: [string, string, string],
  projection: IsometricProjection
) {
  drawIsoBox(ctx, x, y - 16, projection.tileWidth / 2 - 8, 8, 26, colors);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x - 8, y + i * 6);
    ctx.lineTo(x + 8, y + i * 6);
    ctx.stroke();
  }
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, projection: IsometricProjection) {
  drawIsoBox(ctx, x, y + 8, projection.tileWidth / 2 - 16, 5, 8, ['#805437', '#5f3d28', '#9a6b4d']);
  ctx.fillStyle = '#6db77a';
  ctx.fillRect(x - 2, y - 18, 4, 16);
  ctx.fillRect(x - 10, y - 12, 8, 8);
  ctx.fillRect(x + 2, y - 14, 8, 9);
  ctx.fillRect(x - 4, y - 22, 8, 10);
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number, projection: IsometricProjection, tint: string) {
  ctx.fillStyle = '#d7b37d';
  ctx.fillRect(x - 6, y - 18, 12, 6);
  ctx.fillStyle = '#4f5668';
  ctx.fillRect(x - 1, y - 12, 2, 18);
  ctx.fillRect(x - 6, y + 6, 12, 2);
  ctx.globalCompositeOperation = 'screen';
  const glow = ctx.createRadialGradient(x, y - 15, 2, x, y - 15, projection.tileWidth * 0.8);
  glow.addColorStop(0, `${tint}44`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 40, y - 50, 80, 70);
}

function drawBoard(ctx: CanvasRenderingContext2D, x: number, y: number, accent: string) {
  ctx.fillStyle = '#1c2233';
  ctx.fillRect(x - 13, y - 16, 26, 18);
  ctx.strokeStyle = `${accent}99`;
  ctx.strokeRect(x - 12.5, y - 15.5, 25, 17);
  ctx.fillStyle = `${accent}66`;
  ctx.fillRect(x - 9, y - 12, 18, 2);
  ctx.fillRect(x - 9, y - 7, 14, 2);
}

function floorPalette(key: string, tint: string) {
  if (key.includes('plank')) {
    return {
      base: key === 'floor_plank_dark' ? '#4a4038' : '#6b5644',
      line: 'rgba(45, 28, 16, 0.32)',
      highlight: 'rgba(255, 225, 192, 0.22)',
    };
  }
  if (key.includes('carpet')) {
    return {
      base: '#7d4a4a',
      line: 'rgba(255, 217, 178, 0.2)',
      highlight: 'rgba(255, 240, 220, 0.18)',
    };
  }
  if (key.includes('purple') || key.includes('ring')) {
    return {
      base: '#4d4365',
      line: 'rgba(215, 203, 255, 0.18)',
      highlight: 'rgba(255, 255, 255, 0.12)',
    };
  }
  if (key.includes('green') || key.includes('resonance')) {
    return {
      base: '#476359',
      line: 'rgba(207, 255, 229, 0.16)',
      highlight: 'rgba(255, 255, 255, 0.12)',
    };
  }
  if (key.includes('warm') || key.includes('tile')) {
    return {
      base: '#765846',
      line: 'rgba(255, 229, 189, 0.18)',
      highlight: 'rgba(255, 247, 231, 0.14)',
    };
  }
  return {
    base: '#4f5872',
    line: `${tint}44`,
    highlight: 'rgba(255,255,255,0.14)',
  };
}

function drawFloorPattern(
  ctx: CanvasRenderingContext2D,
  key: string,
  x: number,
  y: number,
  projection: IsometricProjection,
  palette: ReturnType<typeof floorPalette>
) {
  ctx.strokeStyle = palette.line;
  ctx.beginPath();
  if (key.includes('plank')) {
    ctx.moveTo(x - 8, y + projection.tileHeight * 0.52);
    ctx.lineTo(x + 8, y + projection.tileHeight * 0.85);
    ctx.moveTo(x - 13, y + projection.tileHeight * 0.35);
    ctx.lineTo(x + 3, y + projection.tileHeight * 0.68);
  } else if (key.includes('ring') || key.includes('resonance')) {
    ctx.ellipse(x, y + projection.tileHeight / 2, 8, 4, 0, 0, Math.PI * 2);
  } else if (key.includes('tile')) {
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x + 10, y + projection.tileHeight / 2);
    ctx.lineTo(x, y + projection.tileHeight - 4);
    ctx.lineTo(x - 10, y + projection.tileHeight / 2);
    ctx.closePath();
  } else {
    ctx.moveTo(x - 10, y + projection.tileHeight / 2);
    ctx.lineTo(x + 10, y + projection.tileHeight / 2);
  }
  ctx.stroke();
}

function wallColors(key: string, tint: string) {
  if (key === 'wall_green') return { top: '#7e6d5c', left: '#5b4e40', right: '#6b5b4a', line: 'rgba(238, 255, 246, 0.14)', accent: tint };
  if (key === 'wall_purple') return { top: '#7d7081', left: '#5b4f5f', right: '#6a5d6f', line: 'rgba(248, 239, 255, 0.14)', accent: tint };
  if (key === 'wall_warm') return { top: '#8c775d', left: '#65553e', right: '#75644b', line: 'rgba(255, 244, 229, 0.14)', accent: tint };
  return { top: '#68768a', left: '#495463', right: '#576374', line: 'rgba(232, 244, 255, 0.16)', accent: tint };
}

function drawWallPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  projection: IsometricProjection,
  palette: ReturnType<typeof wallColors>
) {
  ctx.strokeStyle = palette.line;
  for (let step = 0; step < 3; step += 1) {
    ctx.beginPath();
    ctx.moveTo(x - projection.tileWidth / 2 + 6, y - projection.elevation + 10 + step * 8);
    ctx.lineTo(x + projection.tileWidth / 2 - 6, y - projection.elevation + 10 + step * 8);
    ctx.stroke();
  }
}

function cropBackdrop(image: HTMLImageElement, targetWidth: number, targetHeight: number, focus: string) {
  const imageRatio = image.width / image.height;
  const targetRatio = targetWidth / targetHeight;
  let sw = image.width;
  let sh = image.height;

  if (imageRatio > targetRatio) {
    sw = image.height * targetRatio;
  } else {
    sh = image.width / targetRatio;
  }

  const focusX = focus.includes('left') ? 0.3 : focus.includes('right') ? 0.7 : 0.5;
  const focusY = focus.includes('top') ? 0.3 : focus.includes('bottom') ? 0.7 : 0.5;

  return {
    sx: Math.max(0, Math.min(image.width - sw, image.width * focusX - sw / 2)),
    sy: Math.max(0, Math.min(image.height - sh, image.height * focusY - sh / 2)),
    sw,
    sh,
  };
}
