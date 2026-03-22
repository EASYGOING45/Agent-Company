/**
 * 鸣潮元宇宙 - 动画播放器
 */

import { SpriteSheet } from './SpriteSheet.ts';

export class Animator {
  private spriteSheet: SpriteSheet;
  private currentAnim: string | null = null;
  private currentFrame = 0;
  private frameTimer = 0;

  constructor(spriteSheet: SpriteSheet) {
    this.spriteSheet = spriteSheet;
  }

  play(animationName: string) {
    if (this.currentAnim === animationName) return;

    const anim = this.spriteSheet.config.animations[animationName];
    if (!anim) {
      console.warn(`[WuWa] 动画不存在: ${animationName}`);
      return;
    }

    const previousAnim = this.currentAnim ? this.spriteSheet.config.animations[this.currentAnim] : null;
    const previousRatio = previousAnim ? this.currentFrame / Math.max(1, previousAnim.frames - 1) : 0;

    this.currentAnim = animationName;
    this.currentFrame = Math.round(previousRatio * Math.max(0, anim.frames - 1));
    this.frameTimer = 0;
  }

  getCurrentAnimation(): string | null {
    return this.currentAnim;
  }

  update(delta: number) {
    if (!this.currentAnim) return;

    const anim = this.spriteSheet.config.animations[this.currentAnim];
    if (!anim) return;

    this.frameTimer += delta;
    while (this.frameTimer >= anim.speed) {
      this.frameTimer -= anim.speed;
      this.currentFrame = (this.currentFrame + 1) % anim.frames;
    }
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (!this.currentAnim) return;

    const anim = this.spriteSheet.config.animations[this.currentAnim];
    if (!anim) return;

    const image = this.spriteSheet.getImage(anim.sheet);
    if (!image) return;

    const { frameWidth, frameHeight } = this.spriteSheet.config;
    const srcX = this.currentFrame * frameWidth;
    const srcY = anim.row * frameHeight;
    const drawX = x + (32 - frameWidth) / 2;
    const drawY = y + (32 - frameHeight);

    ctx.drawImage(image, srcX, srcY, frameWidth, frameHeight, drawX, drawY, frameWidth, frameHeight);
  }
}
