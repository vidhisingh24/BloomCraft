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
      {/* Full-Page Background Images Layer - True HD & Natural Colors without milky haze */}
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
            {/* Full-bleed crisp HD background image with slow Ken-Burns pan/zoom */}
            <img
              src={imageSrc}
              alt={slide.alt}
              onError={() => handleImageError(slide.id)}
              className={`w-full h-full object-cover object-center transform transition-transform duration-[6000ms] ease-out ${
                isActive ? 'scale-[1.06]' : 'scale-100'
              }`}
              loading="eager"
            />

            {/* Subtle soft edge vignette for natural framing without washing out colors */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20 pointer-events-none" />
          </div>
        );
      })}

      {/* Centered Poetic Message Card with Signature Brand Pink & Berry Typography */}
      <div className="relative z-20 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center justify-center text-center">
        {INTRO_SLIDES.map((slide: IntroSlideData, index: number) => {
          const isActive = index === currentSlideIndex;

          if (!isActive) return null;

          return (
            <div
              key={`content-${slide.id}`}
              className="w-full max-w-xl sm:max-w-2xl bg-white/85 sm:bg-white/90 backdrop-blur-xl rounded-3xl border border-white/90 shadow-2xl shadow-[#3D272A]/15 px-4 py-6 sm:px-10 sm:py-10 flex flex-col items-center justify-center text-center animate-fade-in transform transition-all duration-700 mx-3 sm:mx-auto"
            >
              {/* Brand Rose Badge */}
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/70 shadow-sm mb-3 sm:mb-6">
                <span className="text-[11px] sm:text-sm font-bold tracking-wider text-[#C0536A] font-mono">
                  {slide.stepNumber} / 03
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C0536A]" />
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#C0536A] font-bold font-sans">
                  {slide.badge}
                </span>
              </div>

              {/* Main Heading - Dark Espresso Berry Text */}
              <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#3D272A] tracking-tight leading-[1.15] mb-2.5 sm:mb-4 select-none">
                {slide.title}
              </h2>

              {/* Poetic Message - Signature Dark Rose / Mauve */}
              <p className="text-xs sm:text-lg md:text-xl text-[#7A5B62] font-normal leading-relaxed max-w-lg mx-auto font-sans">
                {slide.message}
              </p>

              {/* Delicate Floral Divider */}
              <div className="mt-5 sm:mt-7 flex items-center justify-center gap-3 text-[#D96B82]/70">
                <span className="h-px w-14 sm:w-20 bg-gradient-to-r from-transparent to-[#D96B82]/50" />
                <span className="text-base filter drop-shadow-sm">🌸</span>
                <span className="h-px w-14 sm:w-20 bg-gradient-to-l from-transparent to-[#D96B82]/50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Navigation & Progress Indicator at Bottom */}
      <div className="absolute bottom-6 sm:bottom-10 z-30 flex items-center gap-2.5 bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/90 shadow-md">
        {INTRO_SLIDES.map((slide, index) => {
          const isActive = index === currentSlideIndex;
          const isPassed = index < currentSlideIndex;

          return (
            <button
              key={slide.id}
              onClick={() => onSelectSlide?.(index)}
              aria-label={`Go to slide ${index + 1}`}
              className="relative h-2 rounded-full transition-all duration-500 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C0536A] cursor-pointer"
              style={{
                width: isActive ? '42px' : '16px',
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

export default StorySlides;
