import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { PetalCanvas } from './PetalCanvas';
import { LogoReveal } from './LogoReveal';
import { StorySlides } from './StorySlides';
import { INTRO_SLIDES } from './introData';

interface BloomcraftIntroProps {
  onComplete: () => void;
}

type IntroPhase = 'logo' | 'story' | 'ending';

export const BloomcraftIntro: React.FC<BloomcraftIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<IntroPhase>('logo');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [burstTrigger, setBurstTrigger] = useState(1);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Timers ref to avoid memory leaks and allow clean skipping
  const timersRef = useRef<number[]>([]);

  const addTimer = useCallback((callback: () => void, delayMs: number) => {
    const timerId = window.setTimeout(callback, delayMs);
    timersRef.current.push(timerId);
    return timerId;
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  const handleFinishIntro = useCallback(() => {
    clearAllTimers();
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  }, [clearAllTimers, onComplete]);

  // Preload slide images in background
  useEffect(() => {
    INTRO_SLIDES.forEach((slide) => {
      const img1 = new Image();
      img1.src = slide.image;
      const img2 = new Image();
      img2.src = slide.fallbackImage;
    });
  }, []);

  // Lock body scroll while intro is playing
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'instant' });
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Keyboard accessibility: Escape skips intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinishIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFinishIntro]);

  // Master Intro Orchestration
  useEffect(() => {
    clearAllTimers();

    // 1. Initial Bloom Boom Triggered immediately
    setBurstTrigger(1);

    // 2. Secondary burst right as Bloomcraft title reaches peak bloom (600ms)
    addTimer(() => {
      setBurstTrigger((prev) => prev + 1);
    }, 600);

    // 3. Logo phase: ~3.0s, transition to Story Slide 1
    addTimer(() => {
      setPhase('story');
      setCurrentSlideIndex(0);
      setBurstTrigger((prev) => prev + 1);
    }, 3000);

    // 4. Slide 1 -> Slide 2: at 3000 + 3600 = 6600ms
    addTimer(() => {
      setCurrentSlideIndex(1);
      setBurstTrigger((prev) => prev + 1);
    }, 6600);

    // 5. Slide 2 -> Slide 3: at 6600 + 3600 = 10200ms
    addTimer(() => {
      setCurrentSlideIndex(2);
      setBurstTrigger((prev) => prev + 1);
    }, 10200);

    // 6. Slide 3 ends -> Finish intro: at 10200 + 3800 = 14000ms
    addTimer(() => {
      setPhase('ending');
      handleFinishIntro();
    }, 14000);

    return () => {
      clearAllTimers();
    };
  }, [addTimer, clearAllTimers, handleFinishIntro]);

  const handleSelectSlide = (index: number) => {
    setCurrentSlideIndex(index);
    setBurstTrigger((prev) => prev + 1);
  };

  return (
    <div
      role="region"
      aria-label="Bloomcraft cinematic brand introduction"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#FFFDFB] via-[#FFF0F3] to-[#FFE3E8] transition-opacity duration-700 select-none overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Dense Falling Petals Organic Canvas with Boom Bursts & Interactive Wind */}
      <PetalCanvas
        opacity={phase === 'logo' ? 1 : 0.85}
        burstTrigger={burstTrigger}
        dense={true}
      />

      {/* Stage 1: Explosive Logo Reveal */}
      {phase === 'logo' && (
        <>
          {/* Ambient Floral Radial Glow (Only during logo phase) */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.85)_0%,rgba(255,240,243,0.4)_50%,transparent_80%)] z-10" />
          <div className="relative z-20 w-full flex items-center justify-center">
            <LogoReveal isVisible={true} />
          </div>
        </>
      )}

      {/* Stage 2: 3 Editorial Full-Page Crochet Story Slides */}
      {phase !== 'logo' && (
        <StorySlides
          currentSlideIndex={currentSlideIndex}
          onSelectSlide={handleSelectSlide}
        />
      )}

      {/* Skip Intro Button */}
      <button
        onClick={handleFinishIntro}
        aria-label="Skip cinematic introduction and enter store"
        className="absolute top-6 right-6 z-40 flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-[#7A5B62] bg-white/85 hover:bg-white hover:text-[#C0536A] backdrop-blur-md rounded-full border border-rose-200/80 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C0536A] cursor-pointer"
      >
        <span>Skip intro</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default BloomcraftIntro;
