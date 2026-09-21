import React from 'react';
import { BloomcraftIntro } from './BloomcraftIntro';

interface IntroSplashProps {
  onComplete: () => void;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ onComplete }) => {
  return <BloomcraftIntro onComplete={onComplete} />;
};

export default IntroSplash;
