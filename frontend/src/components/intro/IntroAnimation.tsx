import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { INTRO_SLIDES, INTRO_CONFIG } from './intro.config';
import { CinematicSlide } from './CinematicSlide';
import './intro.css';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSkipAvailable, setIsSkipAvailable] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const timersRef = useRef<number[]>([]);
  const isFinishedRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  // Smooth finish and exit transition into the live landing page
  const handleFinish = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    clearAllTimers();
    setIsFadingOut(true);

    // Give 400ms for smooth cross-dissolve into the landing page
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [clearAllTimers, onComplete]);

  // Preload all 4 landscape photographs for zero latency
  useEffect(() => {
    INTRO_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.landscapeImage;
    });
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Lock body scroll while intro is visible
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'instant' });
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Keyboard accessibility: Escape key skips intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFinish]);

  // Master Slide Timeline Orchestration
  useEffect(() => {
    clearAllTimers();

    // If reduced motion is preferred, show final slide briefly and finish
    if (prefersReducedMotion) {
      setCurrentSlideIndex(INTRO_SLIDES.length - 1);
      const timer = window.setTimeout(() => {
        handleFinish();
      }, 900);
      timersRef.current.push(timer);
      return () => clearAllTimers();
    }

    const { skipAvailableDelayMs, maxSafetyTimeoutMs } = INTRO_CONFIG;

    // Enable skip after 1.0s
    const skipTimer = window.setTimeout(() => {
      setIsSkipAvailable(true);
    }, skipAvailableDelayMs);
    timersRef.current.push(skipTimer);

    // Hard safety timeout
    const safetyTimer = window.setTimeout(() => {
      handleFinish();
    }, maxSafetyTimeoutMs);
    timersRef.current.push(safetyTimer);

    // Schedule slide transitions
    let cumulativeDelay = 0;
    for (let i = 0; i < INTRO_SLIDES.length; i++) {
      const slide = INTRO_SLIDES[i];
      cumulativeDelay += slide.durationMs;

      const nextIndex = i + 1;
      const delay = cumulativeDelay;

      const timer = window.setTimeout(() => {
        if (nextIndex < INTRO_SLIDES.length) {
          setCurrentSlideIndex(nextIndex);
        } else {
          handleFinish();
        }
      }, delay);

      timersRef.current.push(timer);
    }

    return () => clearAllTimers();
  }, [clearAllTimers, handleFinish, prefersReducedMotion]);

  // Tap or click anywhere after 1s to skip
  const handleOverlayClick = () => {
    if (isSkipAvailable) {
      handleFinish();
    }
  };

  return (
    <div
      role="region"
      aria-label="Bloomcraft full-screen crochet brand film"
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-[100] w-screen h-screen select-none overflow-hidden transition-all duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      }`}
      style={{
        cursor: isSkipAvailable ? 'pointer' : 'default',
        backgroundColor: '#201014',
      }}
    >
      {/* 4 Full-Screen Edge-to-Edge Photographic Slides */}
      {INTRO_SLIDES.map((slide, index) => (
        <CinematicSlide
          key={slide.id}
          slide={slide}
          isActive={currentSlideIndex === index}
          slideIndex={index}
          totalSlides={INTRO_SLIDES.length}
        />
      ))}

      {/* Slide Navigation Progress Dots (Bottom Center) */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 pointer-events-none">
        {INTRO_SLIDES.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              currentSlideIndex === index
                ? 'w-8 bg-[#E8A5B4] shadow-[0_0_10px_#E8A5B4]'
                : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Skip Button (Bottom-Right, Appears at ~1.0s) */}
      {isSkipAvailable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          aria-label="Skip brand film and enter Bloomcraft store"
          className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-[#FFF0F3] bg-black/40 hover:bg-black/70 hover:text-white backdrop-blur-md rounded-full border border-white/20 shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A5B4] cursor-pointer"
        >
          <span>Skip</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default IntroAnimation;
