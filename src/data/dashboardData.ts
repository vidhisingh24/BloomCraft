export type OrderStatus = 'New' | 'Preparing' | 'Ready' | 'Delivered';
export type DeliveryMethod = 'Vadodara Local' | 'College Delivery' | 'Parcel';
export type CustomRequestStatus = 'New Request' | 'Reviewing' | 'Quote Sent' | 'Accepted' | 'Completed';
export type ProductCategory = 'Keychains' | 'Bouquets' | 'Other Crochet';

export interface DashboardOrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
  color?: string;
}

export interface DashboardOrder {
  id: string;
  customerName: string;
  phone: string;
  items: DashboardOrderItem[];
  total: number;
  deliveryMethod: DeliveryMethod;
  deliveryDetails: string;
  date: string;
  timeSlot?: string;
  status: OrderStatus;
  notes?: string;
}

export interface DashboardCustomRequest {
  id: string;
  customerName: string;
  phone: string;
  referenceImage: string;
  description: string;
  requestedColors: string[];
  quantity: number;
  date: string;
  budgetQuote?: string;
  status: CustomRequestStatus;
  customerNotes?: string;
}

export interface DashboardProduct {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  image: string;
  inStock: boolean;
  tags?: string[];
  description?: string;
}

export interface LocalDeliveryItem {
  id: string;
  orderId: string;
  customerName: string;
  pickupLocation: string;
  preferredDate: string;
  preferredTime: string;
  contact: string;
  status: OrderStatus;
  itemsSummary: string;
}

export interface CollegeDeliveryItem {
  id: string;
  orderId: string;
  customerName: string;
  collegeName: string;
  deliveryPoint: string;
  preferredDate: string;
  preferredTime: string;
  contact: string;
  status: OrderStatus;
  itemsSummary: string;
}

export interface ParcelDeliveryItem {
  id: string;
  orderId: string;
  customerName: string;
  city: string;
  pincode: string;
  courierService?: string;
  trackingNumber?: string;
  shippingStatus: 'Packing' | 'Ready to Dispatch' | 'In Transit' | 'Delivered';
  contact: string;
  itemsSummary: string;
}

export const INITIAL_ORDERS: DashboardOrder[] = [
  {
    id: '#BC-1048',
    customerName: 'Aanya Sharma',
    phone: '+91 98251 44210',
    items: [
      {
        name: 'Pastel Dream Tulip Bouquet',
        quantity: 1,
        price: 899,
        image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=300&q=80',
        color: 'Pastel Pink & Cream',
      },
      {
        name: 'Crochet Strawberry Keychain',
        quantity: 1,
        price: 249,
        image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=300&q=80',
        color: 'Classic Red',
      },
    ],
    total: 1148,
    deliveryMethod: 'Vadodara Local',
    deliveryDetails: 'Inorbit Mall Entrance, Gorwa',
    date: 'Today, 11:20 AM',
    timeSlot: 'Today, 4:00 PM - 5:00 PM',
    status: 'New',
    notes: 'Please pack in gift wrap with a handwritten birthday note: "Happy 21st Diya 🌸"',
  },
  {
    id: '#BC-1047',
    customerName: 'Pooja Patel',
    phone: '+91 97230 18945',
    items: [
      {
        name: 'Eternal Crimson Rose Bunch',
        quantity: 1,
        price: 1199,
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80',
        color: 'Ruby Red',
      },
    ],
    total: 1199,
    deliveryMethod: 'College Delivery',
    deliveryDetails: 'MS University, Faculty of Arts (Canteen Gate)',
    date: 'Today, 09:45 AM',
    timeSlot: 'Tomorrow, 1:30 PM',
    status: 'Preparing',
    notes: 'Extra long satin ribbon requested.',
  },
  {
    id: '#BC-1046',
    customerName: 'Rhea Desai',
    phone: '+91 99042 55312',
    items: [
      {
        name: 'Daisy Charm Keychain',
        quantity: 2,
        price: 179,
        image: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=300&q=80',
        color: 'White & Sunny Yellow',
      },
      {
        name: 'Lavender Sprig Keychain',
        quantity: 1,
        price: 229,
        image: 'https://images.unsplash.com/photo-1611909023032-2d6b3134ecba?auto=format&fit=crop&w=300&q=80',
        color: 'Pastel Violet',
      },
    ],
    total: 587,
    deliveryMethod: 'Parcel',
    deliveryDetails: 'Navrangpura, Ahmedabad - 380009',
    date: 'Yesterday, 04:15 PM',
    status: 'Ready',
    notes: 'Parcel packed in sturdy bubble wrap box.',
  },
  {
    id: '#BC-1045',
    customerName: 'Devanshi Mehta',
    phone: '+91 94280 91234',
    items: [
      {
        name: 'Sunshine Meadow Bouquet',
        quantity: 1,
        price: 949,
        image: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=300&q=80',
        color: 'Sunny Gold & Olive',
      },
    ],
    total: 949,
    deliveryMethod: 'Vadodara Local',
    deliveryDetails: 'Chakli Circle Coffee Shop, Alkapuri',
    date: '22 Sep 2026',
    timeSlot: 'Completed at 6:00 PM',
    status: 'Delivered',
  },
  {
    id: '#BC-1044',
    customerName: 'Kavya Shah',
    phone: '+91 98980 67120',
    items: [
      {
        name: 'Crochet Bear Keychain',
        quantity: 2,
        price: 299,
        image: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=300&q=80',
        color: 'Warm Mocha & Cream Butter',
      },
    ],
    total: 598,
    deliveryMethod: 'College Delivery',
    deliveryDetails: 'Parul University (Hostel Gate 2)',
    date: '22 Sep 2026',
    status: 'Preparing',
    notes: 'Needs matching pink bowties on both bears.',
  },
  {
    id: '#BC-1043',
    customerName: 'Tanvi Joshi',
    phone: '+91 91730 44892',
    items: [
      {
        name: 'Lavender Whisper & Daisy Blend',
        quantity: 1,
        price: 799,
        image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=300&q=80',
        color: 'Korean Craft Wrap Mix',
      },
    ],
    total: 799,
    deliveryMethod: 'Parcel',
    deliveryDetails: 'Vesu, Surat - 395007',
    date: '21 Sep 2026',
    status: 'Delivered',
  },
];

export const INITIAL_CUSTOM_REQUESTS: DashboardCustomRequest[] = [
  {
    id: '#CR-201',
    customerName: 'Ishita Trivedi',
    phone: '+91 98240 77119',
    referenceImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    description: 'A set of 4 mini crochet baby sea turtles with pastel matcha green shells and cream bellies as sister return gifts.',
    requestedColors: ['Matcha Sage Green', 'Cream White', 'Soft Olive'],
    quantity: 4,
    date: 'Today, 10:15 AM',
    budgetQuote: '₹720 (₹180 / piece)',
    status: 'New Request',
    customerNotes: 'Need delivery before 28th September for birthday celebration.',
  },
  {
    id: '#CR-202',
    customerName: 'Meera Choksi',
    phone: '+91 97129 33004',
    referenceImage: 'https://images.unsplash.com/photo-1567653418876-5bb0e566e1c2?auto=format&fit=crop&w=600&q=80',
    description: 'Custom crochet potted succulent plant (string of pearls style) in a tiny terracotta beige yarn pot.',
    requestedColors: ['Mint Green', 'Terracotta Beige', 'Moss Dark Green'],
    quantity: 1,
    date: 'Yesterday, 03:40 PM',
    budgetQuote: '₹450',
    status: 'Reviewing',
    customerNotes: 'Can you make the leaves slightly cascading over the rim of the pot?',
  },
  {
    id: '#CR-203',
    customerName: 'Harshita Varma',
    phone: '+91 99250 88231',
    referenceImage: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80',
    description: 'A customized anniversary bouquet with 3 Lilac Tulips, 2 Blush Roses, and 1 White Daisy with alphabet tag "H & K".',
    requestedColors: ['Soft Lilac', 'Blush Pink', 'Pure Ivory', 'Sage Green'],
    quantity: 1,
    date: '22 Sep 2026',
    budgetQuote: '₹1,050',
    status: 'Quote Sent',
    customerNotes: 'Please confirm if letter tag can be stitched on small wooden heart.',
  },
  {
    id: '#CR-204',
    customerName: 'Sanya Mirza',
    phone: '+91 98981 12345',
    referenceImage: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=600&q=80',
    description: 'Two matching couple crochet cat bag charms with embroidered bell collar (one Calico orange, one Charcoal grey).',
    requestedColors: ['Calico Peach & Brown', 'Charcoal Slate', 'Red Bell Accent'],
    quantity: 2,
    date: '20 Sep 2026',
    budgetQuote: '₹560',
    status: 'Accepted',
    customerNotes: 'Advance payment sent on GPay. Looking forward to it!',
  },
];

export const INITIAL_PRODUCTS: DashboardProduct[] = [
  {
    id: 'kc-daisy-yellow-white',
    name: 'Sunny Yellow & White Daisy Charm',
    category: 'Keychains',
    price: 120,
    image: '/images/keychains/daisy_yellow_white.jpg',
    inStock: true,
    tags: ['Bestseller', 'Handmade'],
    description: 'Handcrafted iconic cottagecore daisy charm with sunny golden center and pure white blooming scalloped petals.',
  },
  {
    id: 'kc-daisy-purple-lavender',
    name: 'Royal Purple & Lavender Daisy Charm',
    category: 'Keychains',
    price: 120,
    image: '/images/keychains/daisy_purple_lavender.jpg',
    inStock: true,
    tags: ['Two-Tone', 'Handmade'],
    description: 'Two-tone floral daisy charm featuring deep royal purple scalloped petals and a soft lavender center disc.',
  },
  {
    id: 'kc-daisy-purple-white',
    name: 'Royal Purple & White Daisy Charm',
    category: 'Keychains',
    price: 120,
    image: '/images/keychains/daisy_purple_white.jpg',
    inStock: true,
    tags: ['Contrast Edit', 'Handmade'],
    description: 'Stunning contrast daisy keychain crafted with deep purple center and crisp white layered petals.',
  },
  {
    id: 'kc-daisy-magenta-white',
    name: 'Magenta & White Daisy Charm',
    category: 'Keychains',
    price: 120,
    image: '/images/keychains/daisy_magenta_white.jpg',
    inStock: true,
    tags: ['Bestseller', 'Handmade'],
    description: 'Handcrafted blooming daisy keychain featuring bold magenta petals and pure white center.',
  },
  {
    id: 'kc-daisy-pink-twotone',
    name: 'Pastel Two-Tone Pink Daisy Charm',
    category: 'Keychains',
    price: 120,
    image: '/images/keychains/daisy_pink_twotone.jpg',
    inStock: true,
    tags: ['Two-Tone', 'Cottagecore'],
    description: 'Sweet double-pink crochet daisy with soft pastel blush petals surrounding a bright candy pink core.',
  },
  {
    id: 'kc-daisy-red-white',
    name: 'Crimson Red & White Daisy Charm',
    category: 'Keychains',
    price: 120,
    image: '/images/keychains/daisy_red_white.jpg',
    inStock: true,
    tags: ['Classic Charm', 'Handmade'],
    description: 'Vibrant crimson red petals with a clean white crocheted center disk and sturdy silver chain.',
  },
  {
    id: 'kc-daisy-sky-blue',
    name: 'Sky Blue & White Daisy Charm',
    category: 'Keychains',
    price: 120,
    image: '/images/keychains/daisy_sky_blue.jpg',
    inStock: true,
    tags: ['Calm Tones', 'Aesthetic'],
    description: 'Refreshing ocean sky blue crochet petals framing a pure white stitched center.',
  },
  {
    id: 'kc-daisy-pink-purple',
    name: 'Pastel Pink & Royal Purple Daisy Charm',
    category: 'Keychains',
    price: 120,
    image: '/images/keychains/daisy_pink_purple.jpg',
    inStock: true,
    tags: ['Unique Color', 'Handmade'],
    description: 'Delicate baby pink textured petals with an intricate royal purple seed core.',
  },
  {
    id: 'kc-spiderman',
    name: 'Hanging Spider-Man Crochet Charm',
    category: 'Keychains',
    price: 120,
    image: '/images/keychains/spiderman_hanging.jpg',
    inStock: true,
    tags: ['Bestseller', 'Handmade'],
    description: 'Handcrafted upside-down hanging Spider-Man crochet amigurumi with white cord.',
  },
  {
    id: 'kc-sunflower-orange',
    name: 'Golden Sunflower Charm (Amber Core)',
    category: 'Keychains',
    price: 120,
    image: '/images/keychains/sunflower_orange.jpg',
    inStock: true,
    tags: ['Sunflower', 'Handmade'],
    description: 'Cheerful handmade sunflower keychain with bright yellow petals and warm amber-orange center.',
  },
  {
    id: 'kc-sunflower-brown',
    name: 'Classic Sunflower Charm (Dark Core)',
    category: 'Keychains',
    price: 120,
    image: '/images/keychains/sunflower_brown.jpg',
    inStock: true,
    tags: ['Sunflower', 'Cottagecore'],
    description: 'Hand-stitched radiant yellow sunflower keychain with dark chocolate seed core.',
  },
  {
    id: 'kc-evil-eye',
    name: 'Evil Eye (Nazar) Protection Charm',
    category: 'Keychains',
    price: 120,
    image: '/images/keychains/evil_eye_amulet.jpg',
    inStock: true,
    tags: ['Protection Charm', 'Nazar Amulet'],
    description: 'Handcrafted royal blue and sky blue circular Evil Eye crochet talisman with key ring.',
  },
  {
    id: 'kc-strawberry',
    name: 'Crochet Strawberry Keychain',
    category: 'Keychains',
    price: 120,
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=400&q=80',
    inStock: true,
    tags: ['Cute Charm'],
    description: 'Handcrafted with vibrant red milk cotton yarn, green calyx, and seed stitching.',
  },
  {
    id: 'kc-mini-rose',
    name: 'Mini Rose Keychain',
    category: 'Keychains',
    price: 199,
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=400&q=80',
    inStock: true,
    tags: ['Romantic', 'Pocket Bloom'],
    description: 'Delicate blooming miniature rose charm with tender green leaves.',
  },
  {
    id: 'kc-bear',
    name: 'Crochet Bear Keychain',
    category: 'Keychains',
    price: 299,
    image: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=400&q=80',
    inStock: true,
    tags: ['Amigurumi'],
    description: 'Snuggly little teddy bear charm with embroidered features and blush bowtie.',
  },
  {
    id: 'kc-daisy',
    name: 'Daisy Charm Keychain',
    category: 'Keychains',
    price: 179,
    image: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=400&q=80',
    inStock: true,
    tags: ['Cottagecore', 'Spring'],
    description: 'Cheerful white daisy with a golden sunny center.',
  },
  {
    id: 'kc-lavender',
    name: 'Lavender Sprig Keychain',
    category: 'Keychains',
    price: 229,
    image: 'https://images.unsplash.com/photo-1611909023032-2d6b3134ecba?auto=format&fit=crop&w=400&q=80',
    inStock: false,
    tags: ['Aesthetic', 'Calm Tones'],
    description: 'Delicate textured lavender flower sprig with sage green stem.',
  },
  {
    id: 'kc-sunflower',
    name: 'Sunny Sunflower Keychain',
    category: 'Keychains',
    price: 259,
    image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=400&q=80',
    inStock: true,
    tags: ['Joyful', 'Handmade'],
    description: 'Warm golden sunflower with textured brown seed center.',
  },
  {
    id: 'bq-tulips',
    name: 'Pastel Dream Tulip Bouquet',
    category: 'Bouquets',
    price: 899,
    image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=400&q=80',
    inStock: true,
    tags: ['Bestseller', 'Everlasting'],
    description: '5 everlasting crochet tulips in pastel pink, cream white and peach.',
  },
  {
    id: 'bq-roses',
    name: 'Eternal Crimson Rose Bunch',
    category: 'Bouquets',
    price: 1199,
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    inStock: true,
    tags: ['Romance Edition', 'Luxury Wrap'],
    description: 'Handcrafted velvety red roses and baby breath accents with luxury wrapping.',
  },
  {
    id: 'bq-sunflower',
    name: 'Sunshine Meadow Bouquet',
    category: 'Bouquets',
    price: 949,
    image: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=400&q=80',
    inStock: true,
    tags: ['Cheer & Joy', 'Graduation Pick'],
    description: 'Yellow sunflowers paired with chamomile daisies and eucalyptus stems.',
  },
  {
    id: 'bq-lavender-daisy',
    name: 'Lavender Whisper & Daisy Blend',
    category: 'Bouquets',
    price: 799,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80',
    inStock: true,
    tags: ['Aesthetic', 'Korean Wrap'],
    description: 'Blooming purple lavender stems and chamomile daisies wrapped in Korean craft paper.',
  },
  {
    id: 'ot-cactus-pot',
    name: 'Mini Crochet Desk Cactus Pot',
    category: 'Other Crochet',
    price: 349,
    image: 'https://images.unsplash.com/photo-1567653418876-5bb0e566e1c2?auto=format&fit=crop&w=400&q=80',
    inStock: true,
    tags: ['Desk Decor', 'Cute Plant'],
    description: 'Cute blooming cactus in a tiny crochet soil base. No watering needed!',
  },
  {
    id: 'ot-coaster-set',
    name: 'Daisy Crochet Coaster (Set of 4)',
    category: 'Other Crochet',
    price: 399,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80',
    inStock: true,
    tags: ['Home Living', 'Table Accent'],
    description: 'Handmade floral cup coasters made from 100% thick heat-resistant milk cotton.',
  },
];
