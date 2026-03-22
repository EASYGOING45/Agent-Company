/**
 * 鸣潮元宇宙 - 粒子特效系统
 */

import type { RenderLayer } from '../canvas/Renderer.ts';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: 'zzz' | 'exclamation' | 'thought' | 'noise';
  text?: string;
  color?: string;
}

export class ParticleSystem implements RenderLayer {
  readonly order = 15;
  private particles: Particle[] = [];

  emitZzz(x: number, y: number) {
    this.particles.push({ x: x + Math.random() * 10 - 5, y: y - 10, vx: 0.4, vy: -0.3, life: 0, maxLife: 1.8, type: 'zzz', text: 'Z' });
  }

  emitExclamation(x: number, y: number) {
    this.particles.push({ x, y: y - 20, vx: 0, vy: -0.45, life: 0, maxLife: 1.3, type: 'exclamation', text: '!' });
  }

  emitThought(x: number, y: number) {
    this.particles.push({ x, y: y - 15, vx: 0, vy: -0.18, life: 0, maxLife: 1.5, type: 'thought', text: '?' });
  }

  emitNoise(x: number, y: number, color = '#64d5ff') {
    this.particles.push({
      x: x + Math.random() * 20 - 10,
      y: y + Math.random() * 20 - 12,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.5,
      life: 0,
      maxLife: 0.8 + Math.random() * 0.8,
      type: 'noise',
      color,
    });
  }

  render(ctx: CanvasRenderingContext2D, delta: number) {
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.life += delta;
      if (particle.life >= particle.maxLife) {
        this.particles.splice(index, 1);
        continue;
      }

      particle.x += particle.vx;
      particle.y += particle.vy;
      const alpha = 1 - particle.life / particle.maxLife;

      ctx.save();
      if (particle.type === 'zzz') {
        ctx.font = `bold ${12 + particle.life * 4}px monospace`;
        ctx.fillStyle = `rgba(160, 205, 255, ${alpha})`;
        ctx.fillText(particle.text ?? 'Z', particle.x, particle.y);
      } else if (particle.type === 'exclamation') {
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = `rgba(255, 102, 102, ${alpha})`;
        ctx.fillText(particle.text ?? '!', particle.x, particle.y);
      } else if (particle.type === 'thought') {
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = `rgba(222, 228, 242, ${alpha})`;
        ctx.fillText(particle.text ?? '?', particle.x, particle.y);
      } else {
        const size = 1.5 + Math.random() * 2.5;
        ctx.fillStyle = hexToRgba(particle.color ?? '#64d5ff', alpha * 0.5);
        ctx.shadowColor = particle.color ?? '#64d5ff';
        ctx.shadowBlur = 8;
        ctx.fillRect(particle.x, particle.y, size, size);
      }
      ctx.restore();
    }
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const int = Number.parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
