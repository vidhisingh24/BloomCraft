export interface IntroSlideData {
  id: string;
  stepNumber: string;
  title: string;
  message: string;
  badge: string;
  image: string;
  fallbackImage: string;
  pinterestUrl: string;
  alt: string;
}

export const INTRO_SLIDES: IntroSlideData[] = [
  {
    id: 'slide-handcrafted',
    stepNumber: '01',
    title: 'Made by hand.',
    message: 'Every little stitch carries a little love.',
    badge: 'Artisanal Craftsmanship',
    image: '/images/intro/slide1_made_by_hand.jpg',
    fallbackImage: 'https://i.pinimg.com/736x/c5/f0/ed/c5f0ed5bf7c5d1533df5cfe819217c77.jpg',
    pinterestUrl: 'https://in.pinterest.com/pin/42362052740272550/',
    alt: 'Hands carefully crafting crochet pieces with milk cotton yarn and hook',
  },
  {
    id: 'slide-everlasting',
    stepNumber: '02',
    title: 'Flowers that never fade.',
    message: 'Handmade blooms made to stay.',
    badge: 'Everlasting Flora',
    image: '/images/intro/slide2_flowers_that_never_fade.jpg',
    fallbackImage: 'https://i.pinimg.com/736x/14/b3/c9/14b3c93f041433fbc3b848bc4c15ee9e.jpg',
    pinterestUrl: 'https://in.pinterest.com/pin/121597258686661576/',
    alt: 'Handmade crochet daisies blooming gracefully with yarn and crochet needle',
  },
  {
    id: 'slide-moments',
    stepNumber: '03',
    title: 'Made for your moments.',
    message: 'Thoughtful little creations, made just for you.',
    badge: 'Custom & Gifting',
    image: '/images/intro/slide3_made_for_your_moments.jpg',
    fallbackImage: 'https://i.pinimg.com/736x/ab/69/1b/ab691b5325670c827bb7e2f071af4d2d.jpg',
    pinterestUrl: 'https://in.pinterest.com/pin/38913984277474182/',
    alt: 'Artfully arranged handmade crochet floral bouquet wrapped in craft paper and ribbon',
  },
];
