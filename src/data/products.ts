export interface Product {
  id: string;
  name: string;
  category: "keychains" | "bouquets";
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  tags?: string[];
  yarnType?: string;
  dimensions?: string;
  stemsCount?: string;
  inStock?: boolean;
  colors?: string[];
}

export const KEYCHAINS_DATA: Product[] = [
  {
    id: "kc-strawberry",
    name: "Crochet Strawberry Keychain",
    category: "keychains",
    price: 249,
    originalPrice: 299,
    description: "Adorable plump strawberry handcrafted with vibrant red milk cotton yarn, adorned with green leafy calyx and sweet seed stitching.",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=700&q=80",
    tags: ["Bestseller", "Cute Gift"],
    yarnType: "100% Soft Milk Cotton Yarn",
    dimensions: "5 cm x 4 cm",
    inStock: true,
    colors: ["Classic Red", "Pastel Pink", "Baby Yellow"],
  },
  {
    id: "kc-mini-rose",
    name: "Mini Rose Keychain",
    category: "keychains",
    price: 199,
    originalPrice: 249,
    description: "A delicate blooming miniature rose charm with two tender green leaves. An everlasting token of love for your keys or handbag.",
    image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=700&q=80",
    tags: ["Romantic", "Pocket Bloom"],
    yarnType: "Hypoallergenic Cotton Blend",
    dimensions: "6 cm x 3.5 cm",
    inStock: true,
    colors: ["Blush Pink", "Ruby Red", "Cream White"],
  },
  {
    id: "kc-bear",
    name: "Crochet Bear Keychain",
    category: "keychains",
    price: 299,
    originalPrice: 349,
    description: "Snuggly little teddy bear charm with embroidered features and a tiny pastel blush bowtie. Soft, durable and irresistible.",
    image: "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=700&q=80",
    tags: ["Most Loved", "Amigurumi"],
    yarnType: "Ultra-soft Acrylic Cotton",
    dimensions: "7 cm x 5 cm",
    inStock: true,
    colors: ["Warm Mocha", "Cream Butter", "Dusty Rose"],
  },
  {
    id: "kc-daisy",
    name: "Daisy Charm Keychain",
    category: "keychains",
    price: 179,
    originalPrice: 219,
    description: "Cheerful white daisy with a golden sunny center. Adds a touch of cottagecore spring aesthetic to your everyday tote bag.",
    image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=700&q=80",
    tags: ["Cottagecore", "Spring"],
    yarnType: "Premium Combed Cotton",
    dimensions: "5.5 cm x 5.5 cm",
    inStock: true,
    colors: ["White & Yellow", "Lilac & Lemon", "Blush Pink"],
  },
  {
    id: "kc-lavender",
    name: "Lavender Sprig Keychain",
    category: "keychains",
    price: 229,
    originalPrice: 279,
    description: "Delicate textured lavender flower sprig with sage green stem. Minimalist, calming, and charming handmade floral accent.",
    image: "https://images.unsplash.com/photo-1611909023032-2d6b3134ecba?auto=format&fit=crop&w=700&q=80",
    tags: ["Aesthetic", "Calm Tones"],
    yarnType: "Pure Milk Cotton Yarn",
    dimensions: "9 cm x 2.5 cm",
    inStock: true,
    colors: ["Classic Lavender", "Deep Violet", "Powder Blue"],
  },
  {
    id: "kc-sunflower",
    name: "Sunny Sunflower Keychain",
    category: "keychains",
    price: 259,
    originalPrice: 299,
    description: "Warm golden sunflower with textured brown seed center that radiates joy and positive energy wherever you carry it.",
    image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=700&q=80",
    tags: ["Joyful", "Handmade"],
    yarnType: "100% Breathable Cotton",
    dimensions: "6.5 cm x 6.5 cm",
    inStock: true,
    colors: ["Golden Sun", "Pastel Yellow", "Autumn Amber"],
  },
];

export const BOUQUETS_DATA: Product[] = [
  {
    id: "bq-tulips",
    name: "Pastel Dream Tulip Bouquet",
    category: "bouquets",
    price: 899,
    originalPrice: 1099,
    description: "A breathtaking arrangement of 5 everlasting crochet tulips in pastel pink, cream white and soft peach, wrapped in textured tissue and finished with a satin ribbon.",
    image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
    tags: ["Bestseller", "Everlasting"],
    yarnType: "Premium Milk Cotton Yarn",
    stemsCount: "5 Full Stems + Foliage",
    dimensions: "Approx. 32 cm height",
    inStock: true,
    colors: ["Pastel Mix (Pink & Cream)", "Soft Lilac & White", "Peach Dream"],
  },
  {
    id: "bq-roses",
    name: "Eternal Crimson Rose Bunch",
    category: "bouquets",
    price: 1199,
    originalPrice: 1499,
    description: "Romantic bouquet of handcrafted velvety red roses and baby's breath accents. The ultimate forever gift for anniversaries, birthdays, or heartfelt confessions.",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    tags: ["Romance Edition", "Luxury Wrap"],
    yarnType: "100% Soft Structured Cotton",
    stemsCount: "6 Velvet Roses + Eucalyptus Sprigs",
    dimensions: "Approx. 35 cm height",
    inStock: true,
    colors: ["Classic Romantic Red", "Dusty Pink Rose", "Pure Ivory"],
  },
  {
    id: "bq-sunflower",
    name: "Sunshine Meadow Bouquet",
    category: "bouquets",
    price: 949,
    originalPrice: 1149,
    description: "Vibrant yellow sunflowers paired with delicate white daisies and eucalyptus stems. Brings cheerful warmth that will never wilt or wither.",
    image: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=800&q=80",
    tags: ["Cheer & Joy", "Graduation Pick"],
    yarnType: "Hypoallergenic Milk Cotton",
    stemsCount: "3 Large Sunflowers + 3 Daisies",
    dimensions: "Approx. 30 cm height",
    inStock: true,
    colors: ["Sunny Gold & Olive", "Pastel Sun & Sage"],
  },
  {
    id: "bq-lavender-daisy",
    name: "Lavender Whisper & Daisy Blend",
    category: "bouquets",
    price: 799,
    originalPrice: 999,
    description: "Serene combination of blooming purple lavender stems, delicate chamomile daisies, and soft green leaves wrapped in minimalist Korean craft paper.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    tags: ["Aesthetic", "Korean Wrap"],
    yarnType: "Fine Combed Cotton",
    stemsCount: "4 Lavender + 3 Daisies + Stems",
    dimensions: "Approx. 28 cm height",
    inStock: true,
    colors: ["Lavender Dream", "Ocean Mist Blue", "Blush Petal"],
  },
];

export const ALL_PRODUCTS: Product[] = [...KEYCHAINS_DATA, ...BOUQUETS_DATA];
