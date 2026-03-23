/**
 * 鸣潮元宇宙 - 精灵图系统
 * 基于 Miniverse SpriteSheet
 */

import { Animator } from './Animator.ts';
import type { SpriteSheetConfig } from './types.ts';

export class SpriteSheet {
  readonly config: SpriteSheetConfig;
  private images: Map<string, HTMLImageElement> = new Map();
  private loaded = false;

  constructor(config: SpriteSheetConfig) {
    this.config = config;
  }

  async load(basePath: string = ''): Promise<void> {
    const entries = Object.entries(this.config.sheets);
    const promises = entries.map(([name, src]) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          void img.decode?.().catch(() => undefined);
          this.images.set(name, img);
          resolve();
        };
        img.onerror = () => {
          console.warn(`[WuWa] 无法加载精灵图: ${src}`);
          resolve();
        };
        const isAbsolute = /^(\/|blob:|data:|https?:\/\/)/.test(src);
        img.src = isAbsolute ? src : `${basePath}/${src}`;
      });
    });

    await Promise.all(promises);
    this.loaded = true;
  }

  getImage(name: string): HTMLImageElement | undefined {
    return this.images.get(name);
  }

  createAnimator(): Animator {
    return new Animator(this);
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  resolveAnimationFrame(animationName: string, frameIndex: number) {
    const animation = this.config.animations[animationName];
    if (!animation) return null;

    const image = this.getImage(animation.sheet);
    if (!image) return null;

    const frameWidth = this.config.frameWidth;
    const frameHeight = this.config.frameHeight;
    const normalizedFrame = Math.max(0, Math.min(frameIndex, animation.frames - 1));

    return {
      animation,
      image,
      frameWidth,
      frameHeight,
      srcX: normalizedFrame * frameWidth,
      srcY: animation.row * frameHeight,
      scale: animation.scale ?? this.config.defaultScale ?? 1,
      offsetX: animation.offsetX ?? this.config.defaultOffsetX ?? 0,
      offsetY: animation.offsetY ?? this.config.defaultOffsetY ?? 0,
    };
  }

  drawAvatarFallback(
    ctx: CanvasRenderingContext2D,
    avatar: HTMLImageElement,
    x: number,
    y: number,
    options: { size?: number; borderColor?: string; backgroundColor?: string } = {}
  ) {
    const size = options.size ?? 36;
    const radius = Math.max(10, Math.round(size * 0.28));
    const drawX = x + (32 - size) / 2;
    const drawY = y + (32 - size) / 2 - 4;

    ctx.save();
    ctx.fillStyle = options.backgroundColor ?? 'rgba(8, 12, 28, 0.92)';
    ctx.strokeStyle = options.borderColor ?? 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(drawX, drawY, size, size, radius);
    ctx.fill();
    ctx.stroke();
    ctx.clip();
    ctx.drawImage(avatar, drawX, drawY, size, size);
    ctx.restore();
  }
}
