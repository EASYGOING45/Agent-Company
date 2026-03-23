/**
 * 鸣潮元宇宙 - 相机系统
 */

export class Camera {
  x = 0;
  y = 0;
  zoom = 1;

  private targetX = 0;
  private targetY = 0;
  private targetZoom = 1;
  private smoothSpeed = 5;
  private zoomSmoothSpeed = 6;

  setTarget(x: number, y: number, immediate = false) {
    this.targetX = x;
    this.targetY = y;
    if (immediate) {
      this.x = x;
      this.y = y;
    }
  }

  setZoom(zoom: number, immediate = false) {
    this.targetZoom = zoom;
    if (immediate) {
      this.zoom = zoom;
    }
  }

  focusOn(worldX: number, worldY: number, viewportWidth: number, viewportHeight: number, zoom = this.targetZoom, immediate = false) {
    this.setZoom(zoom, immediate);
    this.setTarget(
      worldX - viewportWidth / (2 * zoom),
      worldY - viewportHeight / (2 * zoom),
      immediate
    );
  }

  update(delta = 0.016) {
    const moveDamping = 1 - Math.exp(-this.smoothSpeed * delta);
    const zoomDamping = 1 - Math.exp(-this.zoomSmoothSpeed * delta);
    this.x += (this.targetX - this.x) * moveDamping;
    this.y += (this.targetY - this.y) * moveDamping;
    this.zoom += (this.targetZoom - this.zoom) * zoomDamping;
  }

  apply(ctx: CanvasRenderingContext2D) {
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX / this.zoom + this.x,
      y: screenY / this.zoom + this.y,
    };
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.x) * this.zoom,
      y: (worldY - this.y) * this.zoom,
    };
  }
}
