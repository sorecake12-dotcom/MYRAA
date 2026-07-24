import React, { useEffect, useRef } from 'react';
import { OrbState } from '../types';

interface OrbAnimationViewProps {
  state: OrbState;
  amplitude?: number; // 0.0 to 1.0
  onClick?: () => void;
  size?: number;
}

export const OrbAnimationView: React.FC<OrbAnimationViewProps> = ({
  state,
  amplitude = 0,
  onClick,
  size = 260,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotationAngle = 0;
    let waveOffset = 0;
    let pulseScale = 1;
    let pulseDirection = 1;

    // Particle positions
    const particles = Array.from({ length: 12 }, (_, i) => ({
      angle: (i * Math.PI * 2) / 12,
      dist: 70 + Math.random() * 20,
      speed: 0.02 + Math.random() * 0.02,
      radius: 2 + Math.random() * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      const center = size / 2;
      const baseRadius = size * 0.28;

      // Pulse animation logic
      if (state === 'idle') {
        pulseScale += 0.0015 * pulseDirection;
        if (pulseScale > 1.15) pulseDirection = -1;
        if (pulseScale < 1.0) pulseDirection = 1;
      } else {
        pulseScale = 1 + amplitude * 0.25;
      }

      rotationAngle += state === 'thinking' ? 0.08 : state === 'speaking' ? 0.05 : 0.02;
      waveOffset += 0.05;

      // Determine Colors by state
      let colorPrimary = '#FF1744';
      let colorSecondary = '#D500F9';

      if (state === 'idle') {
        colorPrimary = '#B71C1C';
        colorSecondary = '#880E4F';
      } else if (state === 'speaking') {
        colorPrimary = '#E040FB';
        colorSecondary = '#FF1744';
      } else if (state === 'thinking') {
        colorPrimary = '#40C4FF';
        colorSecondary = '#00B0FF';
      }

      const orbRadius = baseRadius * pulseScale;

      // ----------------------------------------------------
      // Layer 1: Radial Outer Glow
      // ----------------------------------------------------
      const outerGlowRadius = orbRadius * 1.8;
      const glowGrad = ctx.createRadialGradient(
        center, center, orbRadius * 0.5,
        center, center, outerGlowRadius
      );
      glowGrad.addColorStop(0, `${colorPrimary}aa`);
      glowGrad.addColorStop(0.5, `${colorSecondary}44`);
      glowGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(center, center, outerGlowRadius, 0, Math.PI * 2);
      ctx.fill();

      // ----------------------------------------------------
      // Layer 2: Core Orb (Sphere 3D Gradient)
      // ----------------------------------------------------
      const coreGrad = ctx.createRadialGradient(
        center - orbRadius * 0.3,
        center - orbRadius * 0.3,
        orbRadius * 0.1,
        center,
        center,
        orbRadius
      );
      coreGrad.addColorStop(0, '#FFFFFF');
      coreGrad.addColorStop(0.2, colorPrimary);
      coreGrad.addColorStop(0.8, colorSecondary);
      coreGrad.addColorStop(1, '#000000');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(center, center, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      // ----------------------------------------------------
      // Layer 3: 3 Rotating Dashed Rings
      // ----------------------------------------------------
      [1.15, 1.3, 1.45].forEach((scale, idx) => {
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate((idx % 2 === 0 ? 1 : -1) * rotationAngle * (1 + idx * 0.2));
        ctx.beginPath();
        ctx.setLineDash([12 - idx * 2, 8 + idx * 2]);
        ctx.arc(0, 0, orbRadius * scale, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 0 ? colorPrimary : colorSecondary;
        ctx.lineWidth = 1.8;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.restore();
      });

      // ----------------------------------------------------
      // Layer 4: Wave Rings (Sine Waves)
      // ----------------------------------------------------
      if (state !== 'idle') {
        ctx.save();
        ctx.translate(center, center);
        ctx.strokeStyle = colorPrimary;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;

        for (let w = 0; w < 3; w++) {
          ctx.beginPath();
          const waveR = orbRadius + 10 + w * 12 + Math.sin(waveOffset + w) * 6;
          for (let a = 0; a <= Math.PI * 2; a += 0.1) {
            const waveAmp = (amplitude * 8 + 3) * Math.sin(a * 6 + waveOffset + w);
            const r = waveR + waveAmp;
            const x = r * Math.cos(a);
            const y = r * Math.sin(a);
            if (a === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
      }

      // ----------------------------------------------------
      // Layer 5: Thinking Arc (Spinning loader arc)
      // ----------------------------------------------------
      if (state === 'thinking') {
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(rotationAngle * 2);
        ctx.strokeStyle = '#40C4FF';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.arc(0, 0, orbRadius * 1.25, 0, Math.PI * 0.8);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, orbRadius * 1.25, Math.PI, Math.PI * 1.8);
        ctx.stroke();
        ctx.restore();
      }

      // ----------------------------------------------------
      // Layer 6: Particles (12 Orbiting Dots)
      // ----------------------------------------------------
      particles.forEach((p) => {
        p.angle += p.speed * (state === 'speaking' ? 2 : 1);
        const currentDist = p.dist * (1 + amplitude * 0.3);
        const px = center + Math.cos(p.angle) * currentDist;
        const py = center + Math.sin(p.angle) * currentDist;

        ctx.fillStyle = colorPrimary;
        ctx.beginPath();
        ctx.arc(px, py, p.radius * (1 + amplitude * 0.5), 0, Math.PI * 2);
        ctx.fill();
      });

      // ----------------------------------------------------
      // Layer 7: Inner Highlight (Sphere Top-Left Lens Reflection)
      // ----------------------------------------------------
      const highlightGrad = ctx.createRadialGradient(
        center - orbRadius * 0.35,
        center - orbRadius * 0.35,
        2,
        center - orbRadius * 0.35,
        center - orbRadius * 0.35,
        orbRadius * 0.4
      );
      highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      highlightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
      highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = highlightGrad;
      ctx.beginPath();
      ctx.arc(
        center - orbRadius * 0.35,
        center - orbRadius * 0.35,
        orbRadius * 0.4,
        0,
        Math.PI * 2
      );
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, amplitude, size]);

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      style={{ width: size, height: size }}
      id="orb-animation-container"
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="block drop-shadow-[0_0_25px_rgba(255,23,68,0.4)]"
      />
    </div>
  );
};
