/**
 * 鸣潮元宇宙 - 场景系统
 * Tile 地图 + 房间切换 + 程序化瓦片兜底
 */

import { Pathfinder } from './Pathfinder.ts';
import type { RenderLayer } from '../canvas/Renderer.ts';

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

const THEME_TINT: Record<NonNullable<SceneConfig['theme']>, string> = {
  blue: '#64d5ff',
  green: '#87f0c7',
  warm: '#ffb27a',
  purple: '#9f8cff',
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
    const width = this.config.tileWidth * this.config.walkable[0].length;
    const height = this.config.tileHeight * this.config.walkable.length;

    ctx.fillStyle = '#040816';
    ctx.fillRect(0, 0, width, height);
    this.drawBackdrop(ctx, width, height);
    this.drawAtmosphere(ctx, width, height);

    const { tileWidth, tileHeight, layers } = this.config;
    for (const layer of layers) {
      for (let row = 0; row < layer.length; row++) {
        for (let col = 0; col < layer[row].length; col++) {
          const key = layer[row][col];
          if (key === DEADSPACE) {
            continue;
          }

          const x = col * tileWidth;
          const y = row * tileHeight;
          const baseKey = key.startsWith('wall') ? 'wall' : key.startsWith('floor') ? 'floor' : key;
          const img = this.loaded ? this.tileImages.get(baseKey) : undefined;

          if (img && (baseKey === 'floor' || baseKey === 'wall')) {
            ctx.save();
            ctx.globalAlpha = baseKey === 'floor' ? 0.35 : 0.5;
            ctx.drawImage(img, x, y, tileWidth, tileHeight);
            ctx.restore();
          }

          if (!key.startsWith('floor') && !key.startsWith('wall') && key !== 'window') {
            this.drawPropShadow(ctx, x, y, tileWidth, tileHeight);
          }
          this.drawProceduralTile(ctx, key, x, y, tileWidth, tileHeight);
        }
      }
    }
  }

  private drawAtmosphere(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const tint = THEME_TINT[this.config.theme ?? 'blue'];
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(7, 14, 34, 0.46)');
    gradient.addColorStop(0.45, 'rgba(7, 12, 26, 0.58)');
    gradient.addColorStop(1, 'rgba(3, 6, 18, 0.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(width * 0.6, height * 0.3, 16, width * 0.6, height * 0.3, width * 0.75);
    glow.addColorStop(0, `${tint}26`);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const windowGlow = ctx.createLinearGradient(0, 0, width, height * 0.75);
    windowGlow.addColorStop(0, `${tint}1f`);
    windowGlow.addColorStop(0.35, `${tint}08`);
    windowGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = windowGlow;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = `${tint}35`;
    ctx.lineWidth = 1;
    for (let x = 16; x < width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 20, height);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBackdrop(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.backdropImage) return;

    const source = cropBackdrop(this.backdropImage, width, height, this.config.backdropPosition ?? 'center');
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.filter = 'saturate(0.95) contrast(1.02)';
    ctx.drawImage(this.backdropImage, source.sx, source.sy, source.sw, source.sh, 0, 0, width, height);
    ctx.restore();
  }

  private drawProceduralTile(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    tileWidth: number,
    tileHeight: number
  ) {
    const theme = this.config.theme ?? 'blue';
    const tint = THEME_TINT[theme];

    if (key.startsWith('floor')) {
      const palette = floorPalette(key, tint);
      const inset = key === 'floor_carpet' ? 2 : 0;
      ctx.fillStyle = palette.base;
      ctx.fillRect(x + inset, y + inset, tileWidth - inset * 2, tileHeight - inset * 2);
      const gloss = ctx.createLinearGradient(x, y, x + tileWidth, y + tileHeight);
      gloss.addColorStop(0, palette.highlight);
      gloss.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gloss;
      ctx.fillRect(x + inset, y + inset, tileWidth - inset * 2, tileHeight - inset * 2);
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + inset + 0.5, y + inset + 0.5, tileWidth - 1 - inset * 2, tileHeight - 1 - inset * 2);
      ctx.fillStyle = palette.highlight;
      ctx.fillRect(x + 2 + inset, y + 2 + inset, tileWidth - 4 - inset * 2, 2);
      drawFloorPattern(ctx, key, x + inset, y + inset, tileWidth - inset * 2, tileHeight - inset * 2, palette);
      if (key === 'floor_grid' || key === 'floor_ring' || key === 'floor_resonance') {
        ctx.strokeStyle = palette.accent;
        ctx.beginPath();
        ctx.moveTo(x + tileWidth / 2, y + 3);
        ctx.lineTo(x + tileWidth / 2, y + tileHeight - 3);
        ctx.moveTo(x + 3, y + tileHeight / 2);
        ctx.lineTo(x + tileWidth - 3, y + tileHeight / 2);
        ctx.stroke();
      }
      if (key === 'floor_carpet') {
        ctx.fillStyle = 'rgba(255, 201, 141, 0.18)';
        ctx.fillRect(x + 4, y + 4, tileWidth - 8, tileHeight - 8);
        ctx.strokeStyle = 'rgba(255, 226, 170, 0.26)';
        ctx.strokeRect(x + 5.5, y + 5.5, tileWidth - 11, tileHeight - 11);
      }
      return;
    }

    if (key.startsWith('wall')) {
      const wall = ctx.createLinearGradient(x, y, x, y + tileHeight);
      const wallPalette = wallColors(key, tint);
      wall.addColorStop(0, wallPalette.top);
      wall.addColorStop(1, wallPalette.bottom);
      ctx.fillStyle = wall;
      ctx.fillRect(x, y, tileWidth, tileHeight);
      drawWallPattern(ctx, key, x, y, tileWidth, tileHeight, wallPalette, tint);
      ctx.fillStyle = tint;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(x + 2, y + 4, tileWidth - 4, 4);
      ctx.fillRect(x + 4, y + tileHeight - 8, tileWidth - 8, 2);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.strokeRect(x + 0.5, y + 0.5, tileWidth - 1, tileHeight - 1);
      return;
    }

    ctx.save();
    if (key === 'desk' || key === 'console' || key === 'table' || key === 'bar') {
      ctx.fillStyle = key === 'bar' ? '#5a4b3f' : '#2b3959';
      ctx.fillRect(x + 3, y + 8, tileWidth - 6, tileHeight - 10);
      ctx.fillStyle = tint;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(x + 5, y + 10, tileWidth - 10, 4);
      ctx.fillRect(x + 6, y + 18, tileWidth - 12, 2);
      ctx.globalAlpha = 1;
    } else if (key === 'bench' || key === 'chair' || key === 'couch') {
      ctx.fillStyle = key === 'couch' ? '#8b5d47' : '#34466f';
      ctx.fillRect(x + 4, y + 12, tileWidth - 8, tileHeight - 12);
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(x + 6, y + 14, tileWidth - 12, 3);
      ctx.fillRect(x + 8, y + 20, tileWidth - 16, 2);
    } else if (key === 'window') {
      ctx.fillStyle = '#15213d';
      ctx.fillRect(x + 6, y + 4, tileWidth - 12, tileHeight - 8);
      ctx.fillStyle = 'rgba(100, 213, 255, 0.45)';
      ctx.fillRect(x + 8, y + 6, tileWidth - 16, tileHeight - 12);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(x + tileWidth / 2, y + 7);
      ctx.lineTo(x + tileWidth / 2, y + tileHeight - 7);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(x + 9, y + 7, 5, tileHeight - 16);
    } else if (key === 'board' || key === 'holo') {
      ctx.fillStyle = '#101931';
      ctx.fillRect(x + 5, y + 5, tileWidth - 10, tileHeight - 10);
      ctx.strokeStyle = tint;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 6, y + 6, tileWidth - 12, tileHeight - 12);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = tint;
      ctx.fillRect(x + 8, y + 9, tileWidth - 16, 2);
      ctx.fillRect(x + 8, y + 15, tileWidth - 12, 2);
      ctx.fillRect(x + 8, y + 21, tileWidth - 18, 2);
      ctx.globalAlpha = 1;
    } else if (key === 'pillar' || key === 'pod') {
      ctx.fillStyle = '#222e4d';
      ctx.fillRect(x + 8, y + 4, tileWidth - 16, tileHeight - 8);
      ctx.fillStyle = tint;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(x + 10, y + 8, tileWidth - 20, tileHeight - 16);
      ctx.globalAlpha = 1;
    } else if (key === 'bookshelf' || key === 'archive') {
      ctx.fillStyle = key === 'archive' ? '#5f4a62' : '#4c362a';
      ctx.fillRect(x + 5, y + 4, tileWidth - 10, tileHeight - 6);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let row = 0; row < 3; row += 1) {
        ctx.fillRect(x + 7, y + 8 + row * 7, tileWidth - 14, 1);
      }
      ctx.fillStyle = tint;
      ctx.globalAlpha = key === 'archive' ? 0.24 : 0.12;
      ctx.fillRect(x + 9, y + 10, tileWidth - 18, 3);
      ctx.globalAlpha = 1;
    } else if (key === 'plant') {
      ctx.fillStyle = '#4c3426';
      ctx.fillRect(x + 11, y + 21, 10, 6);
      ctx.fillStyle = '#5baa6d';
      ctx.fillRect(x + 12, y + 11, 8, 10);
      ctx.fillRect(x + 8, y + 15, 6, 6);
      ctx.fillRect(x + 18, y + 14, 6, 7);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x + 13, y + 12, 2, 4);
    } else if (key === 'lamp') {
      ctx.fillStyle = '#21314d';
      ctx.fillRect(x + 14, y + 8, 4, 16);
      ctx.fillRect(x + 10, y + 22, 12, 4);
      ctx.fillStyle = '#f8d38f';
      ctx.fillRect(x + 11, y + 6, 10, 4);
      ctx.globalCompositeOperation = 'screen';
      const lampGlow = ctx.createRadialGradient(x + 16, y + 10, 1, x + 16, y + 10, 16);
      lampGlow.addColorStop(0, 'rgba(248, 211, 143, 0.32)');
      lampGlow.addColorStop(1, 'rgba(248, 211, 143, 0)');
      ctx.fillStyle = lampGlow;
      ctx.fillRect(x, y - 4, tileWidth, tileHeight);
    } else if (key === 'divider' || key === 'shelf') {
      ctx.fillStyle = '#2b3040';
      ctx.fillRect(x + 7, y + 5, tileWidth - 14, tileHeight - 10);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + 9, y + 8, tileWidth - 18, 2);
      ctx.fillRect(x + 9, y + 14, tileWidth - 18, 2);
    } else if (key === 'crate') {
      ctx.fillStyle = '#6f5330';
      ctx.fillRect(x + 7, y + 10, tileWidth - 14, tileHeight - 10);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeRect(x + 7.5, y + 10.5, tileWidth - 15, tileHeight - 11);
      ctx.beginPath();
      ctx.moveTo(x + 9, y + 12);
      ctx.lineTo(x + tileWidth - 9, y + tileHeight - 2);
      ctx.moveTo(x + tileWidth - 9, y + 12);
      ctx.lineTo(x + 9, y + tileHeight - 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawPropShadow(ctx: CanvasRenderingContext2D, x: number, y: number, tileWidth: number, tileHeight: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.beginPath();
    ctx.ellipse(x + tileWidth / 2, y + tileHeight - 2, tileWidth * 0.34, tileHeight * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function floorPalette(key: string, tint: string) {
  if (key === 'floor_green' || key === 'floor_resonance') {
    return {
      base: '#0c1b24',
      line: 'rgba(135, 240, 199, 0.14)',
      highlight: 'rgba(135, 240, 199, 0.14)',
      accent: 'rgba(135, 240, 199, 0.28)',
    };
  }
  if (key === 'floor_warm' || key === 'floor_carpet') {
    return {
      base: '#201723',
      line: 'rgba(255, 178, 122, 0.14)',
      highlight: 'rgba(255, 178, 122, 0.12)',
      accent: 'rgba(255, 178, 122, 0.25)',
    };
  }
  if (key === 'floor_purple' || key === 'floor_ring') {
    return {
      base: '#15132a',
      line: 'rgba(159, 140, 255, 0.14)',
      highlight: 'rgba(159, 140, 255, 0.12)',
      accent: 'rgba(159, 140, 255, 0.32)',
    };
  }
  if (key === 'floor_tile_warm') {
    return {
      base: '#271c21',
      line: 'rgba(255, 199, 140, 0.16)',
      highlight: 'rgba(255, 221, 177, 0.12)',
      accent: 'rgba(255, 178, 122, 0.3)',
    };
  }
  if (key === 'floor_plank' || key === 'floor_plank_dark') {
    return {
      base: key === 'floor_plank_dark' ? '#151c29' : '#172438',
      line: 'rgba(194, 214, 255, 0.08)',
      highlight: 'rgba(210, 226, 255, 0.08)',
      accent: `${tint}26`,
    };
  }
  return {
    base: '#0b1730',
    line: 'rgba(100, 213, 255, 0.12)',
    highlight: 'rgba(100, 213, 255, 0.12)',
    accent: `${tint}33`,
  };
}

function drawFloorPattern(
  ctx: CanvasRenderingContext2D,
  key: string,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: ReturnType<typeof floorPalette>
) {
  ctx.save();
  if (key === 'floor_plank' || key === 'floor_plank_dark') {
    ctx.strokeStyle = palette.line;
    for (let offset = 5; offset < width; offset += 7) {
      ctx.beginPath();
      ctx.moveTo(x + offset, y + 2);
      ctx.lineTo(x + offset, y + height - 2);
      ctx.stroke();
    }
  } else if (key === 'floor_tile_warm') {
    ctx.strokeStyle = palette.line;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y + 2);
    ctx.lineTo(x + width / 2, y + height - 2);
    ctx.moveTo(x + 2, y + height / 2);
    ctx.lineTo(x + width - 2, y + height / 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = palette.highlight;
    ctx.fillRect(x + 4, y + height - 6, width - 8, 1);
  }
  ctx.restore();
}

function wallColors(key: string, tint: string) {
  if (key === 'wall_green') return { top: '#24394b', bottom: '#162531', groove: 'rgba(135, 240, 199, 0.16)', accent: tint };
  if (key === 'wall_purple') return { top: '#2b2942', bottom: '#17172b', groove: 'rgba(159, 140, 255, 0.16)', accent: tint };
  if (key === 'wall_warm') return { top: '#41352e', bottom: '#211b1d', groove: 'rgba(243, 197, 107, 0.18)', accent: tint };
  return { top: '#253252', bottom: '#151d31', groove: 'rgba(100, 213, 255, 0.14)', accent: tint };
}

function drawWallPattern(
  ctx: CanvasRenderingContext2D,
  key: string,
  x: number,
  y: number,
  tileWidth: number,
  tileHeight: number,
  palette: ReturnType<typeof wallColors>,
  tint: string
) {
  ctx.save();
  ctx.strokeStyle = palette.groove;
  if (key === 'wall_warm') {
    for (let row = 6; row < tileHeight; row += 8) {
      ctx.beginPath();
      ctx.moveTo(x + 2, y + row);
      ctx.lineTo(x + tileWidth - 2, y + row);
      ctx.stroke();
    }
  } else {
    for (let row = 8; row < tileHeight; row += 8) {
      ctx.beginPath();
      ctx.moveTo(x + 2, y + row);
      ctx.lineTo(x + tileWidth - 2, y + row);
      ctx.stroke();
    }
    for (let col = 8; col < tileWidth; col += 12) {
      ctx.beginPath();
      ctx.moveTo(x + col, y + 2);
      ctx.lineTo(x + col, y + tileHeight - 2);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.08;
  ctx.fillStyle = tint;
  ctx.fillRect(x + 3, y + 3, tileWidth - 6, 3);
  ctx.restore();
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
