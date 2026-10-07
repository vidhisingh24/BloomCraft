export interface CustomizedItem {
  id: string;
  title: string;
  category: 'all' | 'bouquets' | 'keychains' | 'special' | 'customized';
  badge: string;
  description: string;
  image: string;
  price: number; // in ₹ (selling price)
  pricePaise: number; // in paise (e.g. 41000 = ₹410)
  colors: string[];
  occasion?: string;
  turnaround?: string;
  clientNote?: string;
}

/**
 * Showcase list of customized orders made by BloomCraft.
 * Includes exact selling prices and photos.
 */
export const CUSTOMIZED_ITEMS: CustomizedItem[] = [
  {
    id: 'custom-rakhi',
    title: 'Customized Rakhi (Set of 6)',
    category: 'customized',
    badge: 'Festive Special • Set of 6',
    description: 'Exquisite set of 6 handcrafted floral crochet Rakhis with glistening pearl beads on delicate colored threads (Sunflower, Pink Bloom, Daisy, Crimson Flower, Sky Blue Rose).',
    image: '/images/customized/custom_rakhi.png',
    price: 410,
    pricePaise: 41000,
    colors: ['Sunflower Yellow', 'Pastel Pink', 'Pure White', 'Crimson Red', 'Sky Blue'],
    occasion: 'Raksha Bandhan & Festive Gifting',
    turnaround: '2 Days',
    clientNote: '"The handmade floral Rakhis are so delicate and beautiful! Everyone in the family adored them."',
  },
  {
    id: 'custom-waist-chain',
    title: 'Customized Waist Chain',
    category: 'customized',
    badge: 'Bespoke Body & Waist Charm',
    description: 'Delicate handcrafted customized waist chain with intricate crochet lace detailing, artisan beads, and bespoke fitting.',
    image: '/images/customized/custom_lace_collar_charm.jpg',
    price: 250,
    pricePaise: 25000,
    colors: ['Baby Pink', 'Warm Gold', 'Ivory White'],
    occasion: 'Custom Styling & Festive Wear',
    turnaround: '3 Days',
    clientNote: '"The intricate scalloped lace pattern and beads were crafted to perfection!"',
  },
  {
    id: 'custom-bow-clip',
    title: 'Customized Bow Clip',
    category: 'customized',
    badge: 'Statement Hair Accessory',
    description: 'Artisan structured crochet bow clip with delicate lattice open-mesh stitch and custom ribbon tails for hair or accessories.',
    image: '/images/customized/custom_crimson_mesh_bow.png',
    price: 200,
    pricePaise: 20000,
    colors: ['Crimson Wine', 'Deep Burgundy'],
    occasion: 'Hair Styling & Festive Wear',
    turnaround: '2 Days',
    clientNote: '"A stunning statement bow that holds its shape beautifully. Love the rich crimson yarn!"',
  },

  {
    id: 'custom-1',
    title: 'Bespoke Sunflower & Rose Garden Bouquet',
    category: 'bouquets',
    badge: 'Anniversary Gift',
    description: 'Custom hand-tied bouquet combining warm golden sunflowers, blush pink roses, and delicate baby’s breath sprigs with premium matte wrapping.',
    image: '/images/customized/custom-1.jpg',
    price: 999,
    pricePaise: 99900,
    colors: ['Golden Sunburst', 'Blush Pink', 'Pure Ivory'],
    occasion: '1st Year Anniversary',
    turnaround: '3 Days',
    clientNote: '"Asked for a mix of sunflowers and pastel roses. Turned out magical!"',
  },
  {
    id: 'custom-3',
    title: 'Pastel Coral & Daisy Keepsake Bouquet',
    category: 'bouquets',
    badge: 'Graduation Keepsake',
    description: 'Special customized pastel arrangement featuring coral red twin tulips, pure white daisies, and soft sage stems.',
    image: '/images/customized/custom-3.jpg',
    price: 849,
    pricePaise: 84900,
    colors: ['Pastel Coral', 'White Daisy', 'Sage Green'],
    occasion: 'Graduation Celebration',
    turnaround: '4 Days',
    clientNote: '"Everlasting flowers that will always remind her of graduation day."',
  },
  {
    id: 'custom-4',
    title: 'Spider-Man Amigurumi Car Mirror Charm',
    category: 'special',
    badge: 'Character Mascot',
    description: 'Bespoke handcrafted hanging Spider-Man charm with extra-long hanging string for rearview mirror suspension.',
    image: '/images/customized/custom-4.jpg',
    price: 300,
    pricePaise: 30000,
    colors: ['Crimson Red', 'Royal Blue', 'Pure White'],
    occasion: 'New Car Gift',
    turnaround: '2 Days',
    clientNote: '"Super cute hanging in the car! Everyone asks where I got it."',
  },
  {
    id: 'custom-5',
    title: 'Luxury Eternal Crimson Bridal Arrangement',
    category: 'bouquets',
    badge: 'Wedding Keepsake',
    description: '6 handcrafted velvet roses in scarlet wine paired with soft eucalyptus sprigs and satin champagne ribbon.',
    image: '/images/customized/custom-5.jpg',
    price: 1299,
    pricePaise: 129900,
    colors: ['Velvet Crimson', 'Eucalyptus Sage', 'Champagne Gold'],
    occasion: 'Pre-Wedding Shoot',
    turnaround: '5 Days',
    clientNote: '"Looked stunning in photos and we get to keep it forever!"',
  },
  {
    id: 'custom-6',
    title: 'Two-Tone Magenta & White Daisy Key Charm',
    category: 'keychains',
    badge: 'Best Friends Duo',
    description: 'Custom matching set of two-tone magenta daisies with hand-crocheted ring attachments for twin best friend keys.',
    image: '/images/customized/custom-6.jpg',
    price: 120,
    pricePaise: 12000,
    colors: ['Magenta Pink', 'Snow White'],
    occasion: 'Friendship Day',
    turnaround: '2 Days',
    clientNote: '"Ordered matching keychains for my best friend and me. Loved it!"',
  },
];
