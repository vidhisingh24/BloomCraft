import React, { useEffect, useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CustomerWelcomeAnimationProps {
  onComplete: () => void;
}

export const CustomerWelcomeAnimation: React.FC<CustomerWelcomeAnimationProps> = ({
  onComplete,
}) => {
  const { user } = useAuth();
  const [lettersVisible, setLettersVisible] = useState(0);
  const [greetingVisible, setGreetingVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const brandLetters = 'BLOOMCRAFT'.split('');
  const customerName = user?.name ? user.name.split(' ')[0] : 'Friend';

  useEffect(() => {
    // 1. Reveal letters one by one (fast, elegant cadence)
    const letterInterval = setInterval(() => {
      setLettersVisible((prev) => {
        if (prev < brandLetters.length) {
          return prev + 1;
        }
        clearInterval(letterInterval);
        return prev;
      });
    }, 110);

    // 2. Reveal personalized greeting & quote
    const greetingTimer = setTimeout(() => {
      setGreetingVisible(true);
    }, 1100);

    // 3. Smooth fadeout and transition into dashboard
    const finishTimer = setTimeout(() => {
      handleFinish();
    }, 3600);

    return () => {
      clearInterval(letterInterval);
      clearTimeout(greetingTimer);
      clearTimeout(finishTimer);
    };
  }, [brandLetters.length]);

  const handleFinish = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  return (
    <div
      role="region"
      aria-label="Welcome to BloomCraft"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#FAF8F5] select-none transition-all duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient background rose-blush orbs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-[#FFE3E8]/80 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-[#F4A6B7]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Crochet Petals Decorative Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <span className="absolute top-12 left-10 text-2xl opacity-40 animate-bounce duration-1000">🌸</span>
        <span className="absolute top-1/3 right-16 text-xl opacity-30 animate-pulse">✨</span>
        <span className="absolute bottom-16 left-1/4 text-2xl opacity-40">🧶</span>
        <span className="absolute bottom-24 right-12 text-3xl opacity-35 animate-bounce">🌷</span>
      </div>

      {/* Main Animated Welcome Card */}
      <div className="relative z-10 max-w-xl mx-auto px-6 text-center space-y-6">
        
        {/* Top Studio Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/30 text-[#C0536A] text-xs font-semibold tracking-widest uppercase shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Handmade Crochet Atelier</span>
        </div>

        {/* Brand Wordmark with Letter-by-Letter Reveal */}
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          {brandLetters.map((letter, index) => (
            <span
              key={index}
              className={`font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-wider text-[#3D272A] transition-all duration-500 transform ${
                index < lettersVisible
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-4 scale-90'
              }`}
              style={{
                transitionDelay: `${index * 30}ms`,
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Personalized Greeting & Tagline */}
        <div
          className={`space-y-2 transition-all duration-700 ease-out ${
            greetingVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#C0536A] italic">
            BloomCraft welcomes {customerName}! 🌸
          </h2>
          <p className="text-xs sm:text-sm text-[#7A5B62] font-light tracking-wide max-w-md mx-auto leading-relaxed">
            A little world of handmade happiness, created just for you.
          </p>
        </div>

        {/* Delicate floral divider line */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <span className="w-12 h-[1px] bg-[#EBD8DC]" />
          <span className="text-base text-[#D96B82]">🌸</span>
          <span className="w-12 h-[1px] bg-[#EBD8DC]" />
        </div>

      </div>

      {/* Skip Button (Bottom-Right) */}
      <button
        onClick={handleFinish}
        className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 z-20 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#7A5B62] bg-white/80 hover:bg-white hover:text-[#C0536A] backdrop-blur-md rounded-full border border-[#EBD8DC] shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Skip welcome animation"
      >
        <span>Enter Boutique</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default CustomerWelcomeAnimation;
