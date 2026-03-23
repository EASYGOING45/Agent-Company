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
  size?: number;
  twist?: number;
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
      size: 4 + Math.random() * 8,
      twist: Math.random() * Math.PI * 2,
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
        ctx.shadowColor = 'rgba(160, 205, 255, 0.45)';
        ctx.shadowBlur = 8;
        ctx.fillText(particle.text ?? 'Z', particle.x, particle.y);
      } else if (particle.type === 'exclamation') {
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = `rgba(255, 102, 102, ${alpha})`;
        ctx.shadowColor = 'rgba(255, 102, 102, 0.45)';
        ctx.shadowBlur = 8;
        ctx.fillText(particle.text ?? '!', particle.x, particle.y);
      } else if (particle.type === 'thought') {
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = `rgba(222, 228, 242, ${alpha})`;
        ctx.shadowColor = 'rgba(222, 228, 242, 0.4)';
        ctx.shadowBlur = 8;
        ctx.fillText(particle.text ?? '?', particle.x, particle.y);
      } else {
        const size = particle.size ?? 6;
        const color = particle.color ?? '#64d5ff';
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.twist ?? 0) + particle.life * 1.8);
        ctx.shadowColor = particle.color ?? '#64d5ff';
        ctx.shadowBlur = 14;
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        glow.addColorStop(0, hexToRgba(color, alpha * 0.6));
        glow.addColorStop(0.65, hexToRgba(color, alpha * 0.18));
        glow.addColorStop(1, hexToRgba(color, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = hexToRgba(color, alpha * 0.75);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-size * 0.9, 0);
        ctx.lineTo(size * 0.9, 0);
        ctx.moveTo(0, -size * 0.55);
        ctx.lineTo(0, size * 0.55);
        ctx.stroke();
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
