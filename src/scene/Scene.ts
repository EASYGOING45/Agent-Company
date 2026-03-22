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
  private loaded = false;

  constructor(config: SceneConfig) {
    this.config = config;
    this.pathfinder = new Pathfinder(config.walkable);
  }

  async load(basePath = ''): Promise<void> {
    this.tileImages.clear();
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

          this.drawProceduralTile(ctx, key, x, y, tileWidth, tileHeight);
        }
      }
    }
  }

  private drawAtmosphere(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const tint = THEME_TINT[this.config.theme ?? 'blue'];
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(7, 14, 34, 0.92)');
    gradient.addColorStop(1, 'rgba(3, 6, 18, 0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(width * 0.6, height * 0.3, 16, width * 0.6, height * 0.3, width * 0.75);
    glow.addColorStop(0, `${tint}26`);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
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
      ctx.fillStyle = palette.base;
      ctx.fillRect(x, y, tileWidth, tileHeight);
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, tileWidth - 1, tileHeight - 1);
      ctx.fillStyle = palette.highlight;
      ctx.fillRect(x + 2, y + 2, tileWidth - 4, 2);
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
        ctx.fillStyle = 'rgba(255, 201, 141, 0.12)';
        ctx.fillRect(x + 4, y + 4, tileWidth - 8, tileHeight - 8);
      }
      return;
    }

    if (key.startsWith('wall')) {
      ctx.fillStyle = '#18223b';
      ctx.fillRect(x, y, tileWidth, tileHeight);
      ctx.fillStyle = tint;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(x + 2, y + 4, tileWidth - 4, 4);
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
      ctx.globalAlpha = 1;
    } else if (key === 'bench' || key === 'chair' || key === 'couch') {
      ctx.fillStyle = key === 'couch' ? '#8b5d47' : '#34466f';
      ctx.fillRect(x + 4, y + 12, tileWidth - 8, tileHeight - 12);
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(x + 6, y + 14, tileWidth - 12, 3);
    } else if (key === 'window') {
      ctx.fillStyle = '#15213d';
      ctx.fillRect(x + 6, y + 4, tileWidth - 12, tileHeight - 8);
      ctx.fillStyle = 'rgba(100, 213, 255, 0.45)';
      ctx.fillRect(x + 8, y + 6, tileWidth - 16, tileHeight - 12);
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
      ctx.globalAlpha = 1;
    } else if (key === 'pillar' || key === 'pod') {
      ctx.fillStyle = '#222e4d';
      ctx.fillRect(x + 8, y + 4, tileWidth - 16, tileHeight - 8);
      ctx.fillStyle = tint;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(x + 10, y + 8, tileWidth - 20, tileHeight - 16);
      ctx.globalAlpha = 1;
    }
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
  return {
    base: '#0b1730',
    line: 'rgba(100, 213, 255, 0.12)',
    highlight: 'rgba(100, 213, 255, 0.12)',
    accent: `${tint}33`,
  };
}
