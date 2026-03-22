/**
 * 鸣潮元宇宙 - 相机系统
 */

export class Camera {
  x = 0;
  y = 0;
  zoom = 1;

  private targetX = 0;
  private targetY = 0;
  private smoothSpeed = 5;

  setTarget(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }

  update() {
    // 平滑跟随
    this.x += (this.targetX - this.x) * (1 - Math.exp(-this.smoothSpeed * 0.016));
    this.y += (this.targetY - this.y) * (1 - Math.exp(-this.smoothSpeed * 0.016));
  }

  apply(ctx: CanvasRenderingContext2D) {
    ctx.translate(-this.x, -this.y);
    ctx.scale(this.zoom, this.zoom);
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX + this.x,
      y: screenY + this.y,
    };
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.x) * this.zoom,
      y: (worldY - this.y) * this.zoom,
    };
  }
}
