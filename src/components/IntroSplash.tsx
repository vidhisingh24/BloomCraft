import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface IntroSplashProps {
  onComplete: () => void;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showText, setShowText] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Petals Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Rose petals particle configuration
    const petalsCount = 38;
    const petals: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      rotation: number;
      rotSpeed: number;
      color: string;
      opacity: number;
      sway: number;
      swaySpeed: number;
    }> = [];

    const petalColors = [
      '#FFB6C1', // Light pink
      '#FFC0CB', // Pink
      '#FFD1DC', // Pastel pink
      '#F4A6B7', // Rose blush
      '#FFE4E1', // Misty rose
      '#E88B9C', // Romantic rose
    ];

    for (let i = 0; i < petalsCount; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * -height * 1.2,
        size: Math.random() * 12 + 10,
        speedY: Math.random() * 1.5 + 1.2,
        speedX: Math.random() * 1 - 0.5,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 2,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        opacity: Math.random() * 0.4 + 0.6,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.03 + 0.015,
      });
    }

    const drawPetal = (
      x: number,
      y: number,
      size: number,
      rotation: number,
      color: string,
      opacity: number
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;

      // Draw petal shape
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-size / 2, -size / 2, -size / 2, size, 0, size * 1.3);
      ctx.bezierCurveTo(size / 2, size, size / 2, -size / 2, 0, 0);
      ctx.closePath();
      ctx.fill();

      // Subtle petal vein
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, size * 0.9);
      ctx.stroke();

      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      petals.forEach((petal) => {
        petal.y += petal.speedY;
        petal.sway += petal.swaySpeed;
        petal.x += Math.sin(petal.sway) * 1.2 + petal.speedX;
        petal.rotation += petal.rotSpeed;

        if (petal.y > height + 20) {
          petal.y = -20;
          petal.x = Math.random() * width;
        }

        drawPetal(
          petal.x,
          petal.y,
          petal.size,
          petal.rotation,
          petal.color,
          petal.opacity
        );
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Text Reveal and Transition Timers
  useEffect(() => {
    // Show text after short delay
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 450);

    // Start fade out after ~2.8s
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2800);

    // Finish splash
    const endTimer = setTimeout(() => {
      onComplete();
    }, 3400);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(endTimer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#FFFDFB] via-[#FFF0F3] to-[#FFE3E8] transition-opacity duration-700 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Falling Rose Petals Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full z-0"
      />

      {/* Decorative Crochet Garland Effect */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-60">
        <span className="w-12 h-px bg-[#D96B82]/40" />
        <span className="text-sm tracking-widest text-[#C0536A] uppercase font-serif">Handmade In Studio</span>
        <span className="w-12 h-px bg-[#D96B82]/40" />
      </div>

      {/* Central Brand Reveal Content */}
      <div className="relative z-10 text-center px-6 max-w-lg mx-auto flex flex-col items-center">
        {/* Cute crochet flower icon badge */}
        <div
          className={`w-16 h-16 mb-5 rounded-full bg-white/80 shadow-md border border-[#F4A6B7]/50 flex items-center justify-center text-[#D96B82] transition-all duration-700 transform ${
            showText ? 'scale-100 opacity-100 rotate-0' : 'scale-75 opacity-0 -rotate-45'
          }`}
        >
          <Sparkles className="w-7 h-7 text-[#D96B82] animate-pulse-subtle" />
        </div>

        {/* Heading: BLOOMCRAFT */}
        <h1
          className={`font-serif text-5xl md:text-6xl lg:text-7xl font-semibold tracking-wider text-[#3D272A] transition-all duration-1000 transform ${
            showText
              ? 'translate-y-0 opacity-100'
              : 'translate-y-6 opacity-0'
          }`}
          style={{ letterSpacing: '0.12em' }}
        >
          BLOOMCRAFT
        </h1>

        {/* Tagline */}
        <p
          className={`mt-4 text-base md:text-lg text-[#7A5B62] font-medium tracking-wide transition-all duration-1000 delay-300 transform ${
            showText
              ? 'translate-y-0 opacity-100'
              : 'translate-y-6 opacity-0'
          }`}
        >
          “Handcrafted with love, made to bloom.”
        </p>

        {/* Soft decorative divider */}
        <div
          className={`mt-6 flex items-center justify-center gap-2 text-[#D96B82] transition-all duration-1000 delay-500 transform ${
            showText ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        >
          <span className="h-px w-8 bg-[#D96B82]/30" />
          <span className="text-xs">🌸</span>
          <span className="h-px w-8 bg-[#D96B82]/30" />
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute bottom-8 right-8 z-20 flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#7A5B62] bg-white/70 hover:bg-white/95 backdrop-blur-md rounded-full border border-rose-200/60 shadow-sm transition-all hover:scale-105"
      >
        <span>Enter Shop</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
