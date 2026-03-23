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
    while (this.frameTimer >= this.getFrameDuration(anim, this.currentFrame)) {
      this.frameTimer -= this.getFrameDuration(anim, this.currentFrame);
      if (this.currentFrame >= anim.frames - 1) {
        if (anim.holdLastFrame) {
          this.currentFrame = anim.frames - 1;
          break;
        }
        this.currentFrame = anim.loop === false ? anim.frames - 1 : 0;
        if (anim.loop === false) break;
      } else {
        this.currentFrame += 1;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (!this.currentAnim) return;

    const frame = this.spriteSheet.resolveAnimationFrame(this.currentAnim, this.currentFrame);
    if (!frame) return;

    const drawWidth = frame.frameWidth * frame.scale;
    const drawHeight = frame.frameHeight * frame.scale;
    const drawX = x + (32 - drawWidth) / 2 + frame.offsetX;
    const drawY = y + (32 - drawHeight) + frame.offsetY;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      frame.image,
      frame.srcX,
      frame.srcY,
      frame.frameWidth,
      frame.frameHeight,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );
  }

  getCurrentFrame(): number {
    return this.currentFrame;
  }

  private getFrameDuration(anim: NonNullable<SpriteSheet['config']['animations'][string]>, frameIndex: number) {
    return anim.frameDurations?.[frameIndex] ?? anim.speed;
  }
}
