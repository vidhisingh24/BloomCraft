import React, { useEffect, useRef, useCallback } from 'react';

export interface PetalCanvasProps {
  opacity?: number;
  burstTrigger?: number; // Increment to trigger a massive boom burst
  dense?: boolean;
}

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  pitch: number;
  pitchSpeed: number;
  roll: number;
  rollSpeed: number;
  yaw: number;
  yawSpeed: number;
  colorTheme: {
    base: string;
    mid: string;
    edge: string;
    vein: string;
  };
  alpha: number;
  maxAlpha: number;
  swayPhase: number;
  swayFreq: number;
  swayAmp: number;
  gravity: number;
  drag: number;
  isBurst?: boolean;
  petalType: number; // 0: rounded rose petal, 1: elongated cherry petal, 2: heart petal
}

const PETAL_THEMES = [
  {
    base: '#C0536A', // Deep rose
    mid: '#E88B9C',
    edge: '#FFE3E8',
    vein: 'rgba(255, 255, 255, 0.65)',
  },
  {
    base: '#D96B82', // Romantic rose pink
    mid: '#F4A6B7',
    edge: '#FFF0F3',
    vein: 'rgba(255, 255, 255, 0.55)',
  },
  {
    base: '#E07A8B', // Misty coral rose
    mid: '#F7B8C4',
    edge: '#FFF5F7',
    vein: 'rgba(255, 255, 255, 0.6)',
  },
  {
    base: '#A83B56', // Crimson velvet
    mid: '#D46A80',
    edge: '#FFDCE3',
    vein: 'rgba(255, 255, 255, 0.5)',
  },
  {
    base: '#F08DA1', // Sakura silk
    mid: '#FBC5D0',
    edge: '#FFFFFF',
    vein: 'rgba(255, 255, 255, 0.75)',
  },
  {
    base: '#E2929F', // Pastel peach-pink
    mid: '#F8CAD1',
    edge: '#FFF7F9',
    vein: 'rgba(255, 255, 255, 0.6)',
  },
];

export const PetalCanvas: React.FC<PetalCanvasProps> = ({
  opacity = 1,
  burstTrigger = 0,
  dense = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const petalsRef = useRef<Petal[]>([]);
  const mouseRef = useRef<{ x: number; y: number; vx: number; vy: number; lastX: number; lastY: number }>({
    x: -1000,
    y: -1000,
    vx: 0,
    vy: 0,
    lastX: -1000,
    lastY: -1000,
  });

  const createAmbientPetal = useCallback((width: number, height: number, spawnAbove = true): Petal => {
    const size = Math.random() * 12 + 10; // 10px to 22px
    const theme = PETAL_THEMES[Math.floor(Math.random() * PETAL_THEMES.length)];
    const maxAlpha = Math.random() * 0.35 + 0.6; // 0.6 to 0.95

    return {
      x: Math.random() * (width + 100) - 50,
      y: spawnAbove ? Math.random() * -height * 0.8 - 30 : Math.random() * height,
      vx: (Math.random() - 0.5) * 0.9,
      vy: Math.random() * 1.5 + 1.2,
      size,
      pitch: Math.random() * Math.PI * 2,
      pitchSpeed: (Math.random() - 0.5) * 0.05 + 0.02,
      roll: Math.random() * Math.PI * 2,
      rollSpeed: (Math.random() - 0.5) * 0.06 + 0.02,
      yaw: Math.random() * Math.PI * 2,
      yawSpeed: (Math.random() - 0.5) * 0.04,
      colorTheme: theme,
      alpha: spawnAbove ? maxAlpha : Math.random() * maxAlpha,
      maxAlpha,
      swayPhase: Math.random() * Math.PI * 2,
      swayFreq: Math.random() * 0.025 + 0.012,
      swayAmp: Math.random() * 2.2 + 1.2,
      gravity: Math.random() * 0.3 + 0.95,
      drag: 0.995,
      isBurst: false,
      petalType: Math.floor(Math.random() * 3),
    };
  }, []);

  const triggerPetalBurst = useCallback((originX?: number, originY?: number, count = 130) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = originX ?? width / 2;
    const centerY = originY ?? height * 0.42;

    const newBurstPetals: Petal[] = [];

    for (let i = 0; i < count; i++) {
      // 360 degree radial distribution with varied velocity
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 16 + 5; // 5 to 21 px/frame initial explosion
      const size = Math.random() * 14 + 11;
      const theme = PETAL_THEMES[Math.floor(Math.random() * PETAL_THEMES.length)];
      const maxAlpha = Math.random() * 0.3 + 0.7;

      newBurstPetals.push({
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.85 - Math.random() * 3, // slight upward puff
        size,
        pitch: Math.random() * Math.PI * 2,
        pitchSpeed: (Math.random() - 0.5) * 0.18 + 0.06,
        roll: Math.random() * Math.PI * 2,
        rollSpeed: (Math.random() - 0.5) * 0.16 + 0.05,
        yaw: Math.random() * Math.PI * 2,
        yawSpeed: (Math.random() - 0.5) * 0.1,
        colorTheme: theme,
        alpha: maxAlpha,
        maxAlpha,
        swayPhase: Math.random() * Math.PI * 2,
        swayFreq: Math.random() * 0.03 + 0.015,
        swayAmp: Math.random() * 2.5 + 1.5,
        gravity: Math.random() * 0.4 + 1.1,
        drag: 0.935, // Decelerates smoothly from explosion into gentle drift
        isBurst: true,
        petalType: Math.floor(Math.random() * 3),
      });
    }

    petalsRef.current = [...petalsRef.current, ...newBurstPetals];
  }, []);

  // Handle burst trigger prop changes
  useEffect(() => {
    if (burstTrigger > 0) {
      triggerPetalBurst(undefined, undefined, 140);
    }
  }, [burstTrigger, triggerPetalBurst]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initial Petal Shower Setup: Rich and dense count (100 to 140 petals)
    const baseCount = dense
      ? Math.min(140, Math.max(70, Math.floor(window.innerWidth / 12)))
      : Math.min(60, Math.max(30, Math.floor(window.innerWidth / 25)));

    const initialPetals: Petal[] = [];
    for (let i = 0; i < baseCount; i++) {
      initialPetals.push(createAmbientPetal(width, height, false));
    }
    petalsRef.current = initialPetals;

    // Trigger initial burst on mount
    triggerPetalBurst(width / 2, height * 0.42, 130);

    // Secondary echoing burst at 400ms for massive floral bloom wave
    const burstTimeout = window.setTimeout(() => {
      triggerPetalBurst(width / 2, height * 0.45, 80);
    }, 450);

    // Track mouse / pointer wind effect
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      const mouse = mouseRef.current;
      mouse.vx = currentX - (mouse.lastX === -1000 ? currentX : mouse.lastX);
      mouse.vy = currentY - (mouse.lastY === -1000 ? currentY : mouse.lastY);
      mouse.lastX = currentX;
      mouse.lastY = currentY;
      mouse.x = currentX;
      mouse.y = currentY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
      mouseRef.current.lastX = -1000;
      mouseRef.current.lastY = -1000;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      triggerPetalBurst(e.clientX - rect.left, e.clientY - rect.top, 35);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    // Drawing realistic curved petal with 3D projection & gradient lighting
    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);

      // 3D Pitch and Roll scale matrix
      ctx.rotate(p.yaw);
      const scaleX = Math.cos(p.pitch);
      const scaleY = Math.cos(p.roll);
      
      // Clamp scale to prevent invisible zero width
      const projectedX = Math.max(0.18, Math.abs(scaleX)) * Math.sign(scaleX || 1);
      const projectedY = Math.max(0.18, Math.abs(scaleY));
      ctx.scale(projectedX, projectedY);

      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha * opacity));

      const w = p.size;
      const h = p.size * 1.38;

      // Romantic gradient from stem base to petal tip
      const grad = ctx.createLinearGradient(0, h * 0.5, 0, -h * 0.5);
      grad.addColorStop(0, p.colorTheme.base);
      grad.addColorStop(0.45, p.colorTheme.mid);
      grad.addColorStop(0.85, p.colorTheme.edge);
      grad.addColorStop(1, '#FFFDFB');

      ctx.fillStyle = grad;

      // Realistic curved organic petal path
      ctx.beginPath();
      if (p.petalType === 0) {
        // Classic Rounded Rose Petal
        ctx.moveTo(0, h * 0.5); // Bottom base
        ctx.bezierCurveTo(-w * 0.85, h * 0.25, -w * 0.8, -h * 0.25, -w * 0.22, -h * 0.48);
        ctx.bezierCurveTo(-w * 0.06, -h * 0.53, w * 0.06, -h * 0.53, w * 0.22, -h * 0.48);
        ctx.bezierCurveTo(w * 0.8, -h * 0.25, w * 0.85, h * 0.25, 0, h * 0.5);
      } else if (p.petalType === 1) {
        // Delicate Notched Cherry Petal
        ctx.moveTo(0, h * 0.5);
        ctx.bezierCurveTo(-w * 0.75, h * 0.2, -w * 0.85, -h * 0.35, -w * 0.15, -h * 0.5);
        ctx.lineTo(0, -h * 0.38); // Notch indent
        ctx.lineTo(w * 0.15, -h * 0.5);
        ctx.bezierCurveTo(w * 0.85, -h * 0.35, w * 0.75, h * 0.2, 0, h * 0.5);
      } else {
        // Heart Shaped Romantic Petal
        ctx.moveTo(0, h * 0.45);
        ctx.bezierCurveTo(-w * 0.95, h * 0.1, -w * 0.7, -h * 0.45, 0, -h * 0.32);
        ctx.bezierCurveTo(w * 0.7, -h * 0.45, w * 0.95, h * 0.1, 0, h * 0.45);
      }
      ctx.closePath();
      ctx.fill();

      // Delicate highlighted rim
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.lineWidth = 0.65;
      ctx.stroke();

      // Translucent central vein line
      ctx.strokeStyle = p.colorTheme.vein;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.42);
      ctx.quadraticCurveTo(w * 0.06, 0, 0, -h * 0.36);
      ctx.stroke();

      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const petals = petalsRef.current;

      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];

        // Apply velocity and drag
        if (p.isBurst) {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= p.drag;
          p.vy *= p.drag;
          p.vy += p.gravity * 0.25; // Settle into gravity

          // Once burst slows down significantly, transition to ambient sway
          if (Math.hypot(p.vx, p.vy) < 2.5) {
            p.isBurst = false;
          }
        } else {
          p.swayPhase += p.swayFreq;
          const swayOffset = Math.sin(p.swayPhase) * p.swayAmp;
          p.x += p.vx + swayOffset;
          p.y += p.vy * p.gravity;
        }

        // Mouse interactive breeze / wake
        if (mouse.x !== -1000) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          const influenceRadius = 140;

          if (dist < influenceRadius && dist > 1) {
            const force = (1 - dist / influenceRadius) * 2.8;
            p.x += (dx / dist) * force * 3.5;
            p.y += (dy / dist) * force * 3.5;
            p.pitchSpeed += (Math.random() - 0.5) * 0.08;
            p.rollSpeed += (Math.random() - 0.5) * 0.08;
          }
        }

        // 3D tumble rotations
        p.pitch += p.pitchSpeed;
        p.roll += p.rollSpeed;
        p.yaw += p.yawSpeed;

        // Reset or recycle offscreen petals
        if (p.y > height + 40 || p.x < -100 || p.x > width + 100) {
          if (petals.length > baseCount) {
            // Remove extra burst petals that fell off screen
            petals.splice(i, 1);
            continue;
          } else {
            // Recycle ambient petals back to top
            Object.assign(p, createAmbientPetal(width, height, true));
            p.y = -30 - Math.random() * 40;
            p.x = Math.random() * (width + 80) - 40;
          }
        }

        drawPetal(p);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      clearTimeout(burstTimeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, [createAmbientPetal, dense, opacity, triggerPetalBurst]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto w-full h-full z-10 transition-opacity duration-1000 cursor-default"
      style={{ opacity }}
    />
  );
};

export default PetalCanvas;
