import React from 'react';
import { type IntroSlideData } from './intro.config';

interface CinematicSlideProps {
  slide: IntroSlideData;
  isActive: boolean;
  slideIndex: number;
  totalSlides: number;
}

export const CinematicSlide: React.FC<CinematicSlideProps> = ({
  slide,
  isActive,
  slideIndex,
  totalSlides,
}) => {
  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden select-none transition-opacity duration-500 ease-in-out ${
        isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
      }`}
    >
      {/* 1. Full-Screen Edge-to-Edge 100vw x 100vh Landscape Photograph */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#2D1B20]">
        <img
          src={slide.landscapeImage}
          alt={slide.alt}
          className={`w-full h-full object-cover object-center ${
            isActive ? 'animate-fullscreen-kenburns' : ''
          }`}
          loading="eager"
        />

        {/* Cinematic Lighting Scrims (Ensures typography contrast while keeping crochet subject crisp) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#201014]/75 via-[#201014]/15 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#201014]/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 brand-film-grain pointer-events-none" />
      </div>

      {/* 2. Luxury Stationery Typography & Editorial Overlays */}
      <div className="relative z-20 w-full h-full max-w-7xl mx-auto px-6 sm:px-12 py-8 flex flex-col justify-between pointer-events-none">
        
        {/* Top Header: Brand Tag & Slide Progress Counter */}
        <div className="w-full flex items-center justify-between pt-2 sm:pt-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#E8A5B4] shadow-[0_0_8px_#E8A5B4] animate-pulse" />
            <span className="text-xs sm:text-sm tracking-[0.28em] uppercase text-[#FFF5F7]/90 font-medium font-brand-sans animate-tag-reveal">
              {slide.tag || 'BLOOMCRAFT'}
            </span>
          </div>

          <div className="text-xs sm:text-sm tracking-widest text-[#FFF5F7]/80 font-brand-sans font-light backdrop-blur-sm px-3 py-1 rounded-full bg-black/20 border border-white/10">
            <span>{String(slideIndex + 1).padStart(2, '0')}</span>
            <span className="mx-1.5 text-[#E8A5B4]">/</span>
            <span>{String(totalSlides).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Bottom Section: Luxury Handwritten / Serif Typography Quote */}
        <div className="w-full pb-8 sm:pb-12 flex flex-col items-center text-center">
          
          {/* Main Editorial Quote */}
          <h2
            key={slide.id + '-quote'}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-brand-serif italic text-[#FFFDFB] drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] tracking-wide animate-quote-reveal max-w-4xl px-4"
          >
            "{slide.quote}"
          </h2>

          {/* Sub-quote & Artisan Detail */}
          {slide.quoteSub && (
            <div
              key={slide.id + '-sub'}
              className="mt-3.5 flex items-center gap-2.5 animate-sub-reveal"
            >
              <span className="w-6 h-[1px] bg-[#E8A5B4]/80" />
              <p className="text-xs sm:text-sm tracking-[0.22em] uppercase text-[#FFE3E8] font-brand-sans font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                {slide.quoteSub}
              </p>
              <span className="w-6 h-[1px] bg-[#E8A5B4]/80" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
