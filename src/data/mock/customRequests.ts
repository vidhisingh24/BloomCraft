import type { CustomRequest } from '../../types';

export const INITIAL_CUSTOM_REQUESTS: CustomRequest[] = [
  {
    id: 'CUSTOM-BC-001',
    createdAt: '2026-09-21T16:20:00.000Z',
    customer: {
      name: 'Sneha Dave',
      phone: '9824011223',
      email: 'snehadave@gmail.com',
    },
    itemType: 'Custom Bouquet',
    referenceImages: [
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=400&q=80',
    ],
    description: 'Looking for a mixed pastel bouquet with 3 baby pink tulips, 2 lavender daisies, and 1 miniature white rose in Korean craft wrapping for convocation.',
    colors: ['Baby Pink', 'Lavender Lilac', 'Pure White', 'Sage Green'],
    quantity: 1,
    budget: { min: 900, max: 1400 },
    neededBy: '2026-10-05',
    occasion: 'Graduation Convocation',
    status: 'quoted',
    quotedPrice: 1150,
    notes: 'Quoted for 6 full stems with custom name tag',
  },
  {
    id: 'CUSTOM-BC-002',
    createdAt: '2026-09-23T09:40:00.000Z',
    customer: {
      name: 'Karan Shah',
      phone: '9723456789',
      email: 'karan.s@gmail.com',
    },
    itemType: 'Keychains / Car Mirror Charm',
    referenceImages: [
      '/images/keychains/spiderman_hanging.jpg',
    ],
    description: 'Need a custom Batman + Spider-Man duo keychain pair for couple car charms.',
    colors: ['Black & Yellow', 'Red & Blue'],
    quantity: 2,
    budget: { min: 250, max: 400 },
    neededBy: '2026-09-30',
    occasion: 'Anniversary Gift',
    status: 'in_progress',
    quotedPrice: 320,
    notes: 'Pattern drafted, making started',
  },
];
