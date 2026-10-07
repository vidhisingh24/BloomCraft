/**
 * Bloomcraft Full-Screen Landscape Brand Film Configuration
 * Seamless 100vw x 100vh authentic crochet photography with luxury stationery typography.
 */

export interface IntroSlideData {
  id: number;
  landscapeImage: string;
  portraitFallback: string;
  quote: string;
  quoteSub?: string;
  tag?: string;
  durationMs: number;
  alt: string;
  textPosition?: 'bottom-center' | 'bottom-left' | 'top-center' | 'center-left';
}

export const INTRO_SLIDES: IntroSlideData[] = [
  {
    id: 1,
    landscapeImage: '/intro/landscape-1.jpg',
    portraitFallback: '/intro/intro-1.jpg',
    quote: 'From a simple thread…',
    quoteSub: 'Pure wool & soft blush tones',
    tag: 'THE BEGINNING',
    durationMs: 1350,
    alt: 'Handmade crochet yarn skeins in soft rose and blush pink tones',
    textPosition: 'bottom-center',
  },
  {
    id: 2,
    landscapeImage: '/intro/landscape-2.jpg',
    portraitFallback: '/intro/intro-2.jpg',
    quote: 'Every loop holds a little story.',
    quoteSub: 'Crafted stitch by stitch',
    tag: 'THE PROCESS',
    durationMs: 1350,
    alt: 'Crochet hook and working yarn with delicate stitches',
    textPosition: 'bottom-center',
  },
  {
    id: 3,
    landscapeImage: '/intro/landscape-3.jpg',
    portraitFallback: '/intro/intro-3.jpg',
    quote: 'Made slowly, with love.',
    quoteSub: 'Handcrafted one stitch at a time',
    tag: 'THE CRAFT',
    durationMs: 1350,
    alt: 'Close-up of hands crocheting delicate pastel pink stitches',
    textPosition: 'bottom-center',
  },
  {
    id: 4,
    landscapeImage: '/intro/landscape-4.jpg',
    portraitFallback: '/intro/intro-4.jpg',
    quote: '…something beautiful begins to bloom.',
    quoteSub: 'Everlasting artisan flowers',
    tag: 'THE BLOOM',
    durationMs: 1400,
    alt: 'Handmade blooming crochet flower collection with vintage tools',
    textPosition: 'bottom-center',
  },
];

export const INTRO_CONFIG = {
  enabled: true,
  storageKey: 'bloomcraft_fullscreen_brand_film_v6',
  skipAvailableDelayMs: 400,
  transitionDurationMs: 400,
  maxSafetyTimeoutMs: 7000,

  colors: {
    creamBg: '#FAF8F5',
    textDark: '#3D272A',
    textMuted: '#7A5B62',
    roseSoft: '#FFE3E8',
    roseDeep: '#C0536A',
  },
};

