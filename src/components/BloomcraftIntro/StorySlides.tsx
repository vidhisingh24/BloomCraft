import React, { useState } from 'react';
import { INTRO_SLIDES, type IntroSlideData } from './introData';

interface StorySlidesProps {
  currentSlideIndex: number;
  onSelectSlide?: (index: number) => void;
}

export const StorySlides: React.FC<StorySlidesProps> = ({
  currentSlideIndex,
  onSelectSlide,
}) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden flex flex-col items-center justify-center">
      {/* Full-Page Background Images Layer */}
      {INTRO_SLIDES.map((slide: IntroSlideData, index: number) => {
        const isActive = index === currentSlideIndex;
        const isError = imageErrors[slide.id];
        const imageSrc = isError ? slide.fallbackImage : slide.image;

        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10 pointer-events-none'
            }`}
          >
            {/* Full-bleed high quality background image with slow Ken-Burns pan/zoom */}
            <img
              src={imageSrc}
              alt={slide.alt}
              onError={() => handleImageError(slide.id)}
              className={`w-full h-full object-cover object-center transform transition-transform duration-[6000ms] ease-out ${
                isActive ? 'scale-[1.08]' : 'scale-100'
              }`}
              loading="eager"
            />

            {/* Cinematic Luxury Dark Scrim & Romantic Rosy Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0C10]/85 via-[#251016]/45 to-[#1A0C10]/65 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.15)_0%,rgba(26,12,16,0.75)_100%)] pointer-events-none" />
          </div>
        );
      })}

      {/* Centered Poetic Message Overlay */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-6 sm:px-8 py-8 flex flex-col items-center justify-center text-center">
        {INTRO_SLIDES.map((slide: IntroSlideData, index: number) => {
          const isActive = index === currentSlideIndex;

          if (!isActive) return null;

          return (
            <div
              key={`content-${slide.id}`}
              className="flex flex-col items-center justify-center text-center animate-fade-in max-w-2xl mx-auto"
            >
              {/* Floating Glassmorphism Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/35 shadow-lg shadow-black/20 mb-6 sm:mb-8 transform transition-transform duration-700 hover:scale-105">
                <span className="text-xs sm:text-sm font-bold tracking-widest text-[#FFCCD5] font-mono">
                  {slide.stepNumber} / 03
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F4A6B7]" />
                <span className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-white/95 font-semibold font-sans">
                  {slide.badge}
                </span>
              </div>

              {/* Main Heading (Full Page Statement) */}
              <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.1] mb-5 sm:mb-6 drop-shadow-[0_4px_28px_rgba(0,0,0,0.65)] select-none">
                {slide.title}
              </h2>

              {/* Poetic Message */}
              <p className="text-lg sm:text-2xl md:text-3xl text-rose-100/95 font-light leading-relaxed max-w-xl mx-auto drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)] font-sans">
                {slide.message}
              </p>

              {/* Delicate Floral Divider */}
              <div className="mt-8 sm:mt-10 flex items-center justify-center gap-4 text-rose-300/85">
                <span className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-rose-300/70 to-rose-300/20" />
                <span className="text-lg sm:text-xl filter drop-shadow-md">🌸</span>
                <span className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent via-rose-300/70 to-rose-300/20" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Navigation & Progress Indicator at Bottom */}
      <div className="absolute bottom-8 sm:bottom-12 z-30 flex items-center gap-3">
        {INTRO_SLIDES.map((slide, index) => {
          const isActive = index === currentSlideIndex;
          const isPassed = index < currentSlideIndex;

          return (
            <button
              key={slide.id}
              onClick={() => onSelectSlide?.(index)}
              aria-label={`Go to slide ${index + 1}`}
              className="relative h-2.5 rounded-full transition-all duration-500 overflow-hidden backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 shadow-md cursor-pointer"
              style={{
                width: isActive ? '48px' : '18px',
                backgroundColor: isPassed ? '#F4A6B7' : 'rgba(255, 255, 255, 0.35)',
              }}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#F4A6B7] to-white rounded-full animate-progress-fill" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StorySlides;
