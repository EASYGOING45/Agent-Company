/**
 * 鸣潮元宇宙 - 语音气泡系统
 */

import type { RenderLayer } from '../canvas/Renderer.ts';

interface Bubble {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
}

export class SpeechBubbleSystem implements RenderLayer {
  readonly order = 20;
  private bubbles: Bubble[] = [];

  show(x: number, y: number, text: string, duration: number = 4) {
    // 截断过长文本
    const displayText = text.length > 40 ? text.slice(0, 37) + '...' : text;
    
    this.bubbles.push({
      x,
      y: y - 30,
      text: displayText,
      life: 0,
      maxLife: duration,
    });
  }

  render(ctx: CanvasRenderingContext2D, delta: number) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.life += delta;

      if (b.life >= b.maxLife) {
        this.bubbles.splice(i, 1);
        continue;
      }

      const alpha = Math.min(1, b.life * 2) * Math.min(1, (b.maxLife - b.life) * 2);

      ctx.save();
      
      // 计算文字宽度
      ctx.font = '11px "Noto Sans SC", sans-serif';
      const padding = 8;
      const maxWidth = 150;
      const lines = this.wrapText(ctx, b.text, maxWidth);
      const lineHeight = 14;
      const textWidth = Math.min(maxWidth, Math.max(...lines.map(l => ctx.measureText(l).width)));
      const boxWidth = textWidth + padding * 2;
      const boxHeight = lines.length * lineHeight + padding;

      // 气泡背景
      ctx.fillStyle = `rgba(10, 10, 26, ${0.9 * alpha})`;
      ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
      ctx.lineWidth = 1;
      
      // 圆角矩形
      const x = b.x - boxWidth / 2;
      const y = b.y - boxHeight;
      this.roundRect(ctx, x, y, boxWidth, boxHeight, 4);
      ctx.fill();
      ctx.stroke();

      // 小三角
      ctx.beginPath();
      ctx.moveTo(b.x - 4, b.y);
      ctx.lineTo(b.x + 4, b.y);
      ctx.lineTo(b.x, b.y + 4);
      ctx.closePath();
      ctx.fill();

      // 文字
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.textAlign = 'left';
      lines.forEach((line, idx) => {
        ctx.fillText(line, x + padding, y + padding + 10 + idx * lineHeight);
      });

      ctx.restore();
    }
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    lines.push(currentLine);
    return lines;
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
