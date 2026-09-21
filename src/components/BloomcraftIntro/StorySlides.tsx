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
    <div className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col items-center justify-center min-h-[520px] sm:min-h-[580px]">
      {/* Slides Container */}
      <div className="relative w-full h-[480px] sm:h-[520px] md:h-[500px]">
        {INTRO_SLIDES.map((slide: IntroSlideData, index: number) => {
          const isActive = index === currentSlideIndex;
          const isError = imageErrors[slide.id];
          const imageSrc = isError ? slide.fallbackImage : slide.image;

          return (
            <div
              key={slide.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 w-full h-full flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-10 md:gap-14 transition-all duration-1000 ease-out ${
                isActive
                  ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                  : 'opacity-0 translate-y-8 scale-[0.98] pointer-events-none'
              }`}
            >
              {/* Left/Top: Large Editorial Image */}
              <div className="w-full md:w-1/2 flex justify-center items-center">
                <div className="relative group w-full max-w-[280px] sm:max-w-[340px] md:max-w-[400px] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-[#D96B82]/20 border-2 border-white/80 bg-[#FFF0F3]">
                  {/* Subtle Inner Glow Border */}
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-[#F4A6B7]/30 z-10 pointer-events-none" />

                  {/* Main Editorial Image with Ken Burns zoom effect */}
                  <img
                    src={imageSrc}
                    alt={slide.alt}
                    onError={() => handleImageError(slide.id)}
                    className={`w-full h-full object-cover object-center transform transition-transform duration-[4000ms] ease-out ${
                      isActive ? 'scale-105' : 'scale-100'
                    }`}
                    loading="eager"
                  />

                  {/* Subtle Vignette Gradient for Luxury Editorial Feel */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#3D272A]/30 via-transparent to-transparent opacity-40 pointer-events-none z-10" />

                  {/* Soft Floating Studio Badge */}
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 backdrop-blur-md bg-white/85 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-white/90 shadow-sm">
                    <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#C0536A] uppercase">
                      {slide.badge}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right/Bottom: Poetic Story Typography */}
              <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left px-2 sm:px-4">
                {/* Slide Counter & Accent Line */}
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm font-bold tracking-widest text-[#D96B82] font-mono">
                    {slide.stepNumber} / 03
                  </span>
                  <span className="w-8 sm:w-12 h-px bg-[#D96B82]/40" />
                  <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#A4838B] font-medium font-sans">
                    Bloomcraft Story
                  </span>
                </div>

                {/* Main Heading */}
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#3D272A] tracking-tight leading-[1.15] mb-3 sm:mb-4">
                  {slide.title}
                </h2>

                {/* Poetic Message */}
                <p className="text-base sm:text-lg md:text-xl text-[#7A5B62] font-normal leading-relaxed max-w-md">
                  {slide.message}
                </p>

                {/* Delicate Divider & Quote Decor */}
                <div className="mt-5 sm:mt-8 flex items-center gap-3 text-[#D96B82]/50">
                  <span className="h-px w-12 bg-gradient-to-r from-[#D96B82]/40 to-transparent" />
                  <span className="text-sm">🌸</span>
                  <span className="h-px w-12 bg-gradient-to-l from-[#D96B82]/40 to-transparent" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Navigation & Progress Bar */}
      <div className="relative z-30 mt-6 sm:mt-8 flex items-center gap-2.5">
        {INTRO_SLIDES.map((slide, index) => {
          const isActive = index === currentSlideIndex;
          const isPassed = index < currentSlideIndex;

          return (
            <button
              key={slide.id}
              onClick={() => onSelectSlide?.(index)}
              aria-label={`Go to slide ${index + 1}`}
              className="relative h-2 rounded-full transition-all duration-500 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C0536A]"
              style={{
                width: isActive ? '40px' : '16px',
                backgroundColor: isPassed ? '#D96B82' : 'rgba(217, 107, 130, 0.25)',
              }}
            >
              {isActive && (
                <div className="absolute inset-0 bg-[#D96B82] rounded-full animate-progress-fill" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
