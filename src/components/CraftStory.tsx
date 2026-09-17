import React from 'react';
import { Sparkles, Star } from 'lucide-react';
import { KEYCHAINS_DATA, BOUQUETS_DATA, type Product } from '../data/products';
import { useCart } from '../context/CartContext';

interface CraftStoryProps {
  onSelectProduct: (product: Product) => void;
  onNavigate: (tab: string) => void;
}

export const CraftStory: React.FC<CraftStoryProps> = ({ onSelectProduct, onNavigate }) => {
  const { addToCart } = useCart();

  const featuredItems = [
    KEYCHAINS_DATA[0], // Strawberry
    BOUQUETS_DATA[0],   // Pastel Tulips
    KEYCHAINS_DATA[1], // Mini Rose
    BOUQUETS_DATA[1],   // Crimson Rose Bunch
  ];

  const testimonials = [
    {
      name: "Rhea M.",
      city: "Mumbai",
      review: "The crochet tulips look so whimsical and delicate! My partner was thrilled to receive flowers that will never wither. Packaging was so aesthetic! 💕",
      rating: 5,
      item: "Pastel Dream Tulip Bouquet",
    },
    {
      name: "Ananya S.",
      city: "Bangalore",
      review: "Ordered the crochet strawberry keychain for my tote bag. The milk cotton yarn is so soft and sturdy. Worth every rupee!",
      rating: 5,
      item: "Strawberry Keychain",
    },
    {
      name: "Karan D.",
      city: "Jaipur",
      review: "Requested a custom anniversary bouquet replica via WhatsApp. The artisan was so responsive and crafted exactly what I envisioned.",
      rating: 5,
      item: "Custom Bouquet Order",
    },
  ];

  return (
    <div className="py-16 space-y-20">
      
      {/* Featured Bestsellers Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C0536A]">
              <Sparkles className="w-3.5 h-3.5 text-[#D96B82]" />
              <span>Handpicked Favorites</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#3D272A] mt-1">
              Most Loved Creations
            </h2>
          </div>
          <button
            onClick={() => onNavigate('keychains')}
            className="mt-4 md:mt-0 text-xs font-semibold text-[#D96B82] hover:text-[#C0536A] flex items-center gap-1 self-start md:self-auto"
          >
            <span>View all products</span>
            <span>→</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-3xl p-4 border border-[#F4A6B7]/30 crochet-shadow crochet-card-hover flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FFF0F3] mb-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                    onClick={() => onSelectProduct(item)}
                    loading="lazy"
                  />
                  {item.tags && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-[#C0536A]">
                      {item.tags[0]}
                    </span>
                  )}
                </div>

                <div className="text-[10px] font-semibold text-[#A4838B] uppercase tracking-wider">
                  {item.category === 'keychains' ? 'Keychain' : 'Bouquet'}
                </div>
                <h3
                  onClick={() => onSelectProduct(item)}
                  className="font-serif text-base font-bold text-[#3D272A] group-hover:text-[#C0536A] transition-colors cursor-pointer line-clamp-1"
                >
                  {item.name}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between">
                <span className="text-base font-bold text-[#C0536A]">₹{item.price}</span>
                <button
                  onClick={() => addToCart(item, 1)}
                  className="px-3.5 py-1.5 bg-[#FFE3E8] hover:bg-[#D96B82] text-[#C0536A] hover:text-white rounded-full text-xs font-semibold transition-all shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose BloomCraft Story Grid */}
      <section className="bg-gradient-to-r from-[#FFF5F7] via-[#FFFDFB] to-[#FFE8EC] py-16 border-y border-[#F4A6B7]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest text-[#C0536A] font-semibold">
              The Artisan Promise
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#3D272A] mt-1">
              Why Our Handmade Blooms Stand Out
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-rose-100/90 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFE3E8] flex items-center justify-center text-[#D96B82] mx-auto text-xl">
                🧶
              </div>
              <h3 className="font-serif text-lg font-bold text-[#3D272A]">
                100% Milk Cotton Yarn
              </h3>
              <p className="text-xs text-[#7A5B62] leading-relaxed">
                We use premium, hypoallergenic milk cotton known for its velvety soft texture, rich color holding, and resistance to fraying over time.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-rose-100/90 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFE3E8] flex items-center justify-center text-[#D96B82] mx-auto text-xl">
                🌸
              </div>
              <h3 className="font-serif text-lg font-bold text-[#3D272A]">
                Everlasting Keepsakes
              </h3>
              <p className="text-xs text-[#7A5B62] leading-relaxed">
                A bouquet that never needs water, never wilts, and stays as a warm reminder of your special memory for years to come.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-rose-100/90 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFE3E8] flex items-center justify-center text-[#D96B82] mx-auto text-xl">
                🎁
              </div>
              <h3 className="font-serif text-lg font-bold text-[#3D272A]">
                Gift Ready Packaging
              </h3>
              <p className="text-xs text-[#7A5B62] leading-relaxed">
                Every creation comes packaged in our signature kraft box with floral tissue wrap, silk ribbon, and an optional handwritten keepsake note.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Love Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-widest text-[#C0536A] font-semibold">
            Customer Love
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#3D272A] mt-1">
            Smiles Made to Bloom
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-rose-100 crochet-shadow flex flex-col justify-between"
            >
              <div>
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-[#D96B82] mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#5C3E45] italic leading-relaxed">
                  “{t.review}”
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-rose-100 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#3D272A]">{t.name}</p>
                  <p className="text-[11px] text-[#A4838B]">{t.city}</p>
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 bg-[#FFF0F3] text-[#C0536A] rounded-full">
                  {t.item}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
