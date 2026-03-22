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
}
