import React from 'react';
import { IntroAnimation } from './intro/IntroAnimation';

interface IntroSplashProps {
  onComplete: () => void;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ onComplete }) => {
  return <IntroAnimation onComplete={onComplete} />;
};

export default IntroSplash;

