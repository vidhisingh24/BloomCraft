import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CategoryCardsProps {
  onSelectCategory: (category: 'keychains' | 'bouquets' | 'customize') => void;
}

export const CategoryCards: React.FC<CategoryCardsProps> = ({ onSelectCategory }) => {
  const categories = [
    {
      id: 'keychains' as const,
      icon: '🧶',
      title: 'Keychains',
      description: 'Cute handmade crochet keychains.',
      accentColor: 'from-[#FFE3E8] to-[#FFF0F3]',
      tag: '6+ Designs Available',
      image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80',
      priceFrom: 'Starting from ₹179',
    },
    {
      id: 'bouquets' as const,
      icon: '💐',
      title: 'Bouquets',
      description: 'Beautiful flowers that never fade.',
      accentColor: 'from-[#FFF0F3] to-[#FFE3E8]',
      tag: 'Everlasting Stems',
      image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80',
      priceFrom: 'Starting from ₹799',
    },
    {
      id: 'customize' as const,
      icon: '✨',
      title: 'Customized',
      description: 'Have an idea? Let us create it.',
      accentColor: 'from-[#FFE8EC] to-[#FFF5F7]',
      tag: 'Bespoke Handmade',
      image: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=600&q=80',
      priceFrom: 'Instant Custom Quote',
    },
  ];

  return (
    <section className="py-12 bg-gradient-to-b from-transparent via-[#FFF5F7]/50 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-widest text-[#C0536A] font-semibold">
            Explore Collections
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#3D272A] mt-1">
            Handcrafted with Care & Yarn
          </h2>
          <p className="text-sm sm:text-base text-[#7A5B62] mt-2">
            Every stitch is woven with passion, high-quality cotton yarn, and endless attention to detail.
          </p>
        </div>

        {/* 3 Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group cursor-pointer bg-white rounded-3xl p-5 sm:p-6 border border-[#F4A6B7]/30 crochet-shadow crochet-card-hover flex flex-col justify-between relative overflow-hidden"
            >
              {/* Subtle background gradient glow */}
              <div
                className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${cat.accentColor} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`}
              />

              <div>
                {/* Image preview banner */}
                <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-5 bg-[#FFF0F3]">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-[#5C3E45] shadow-sm flex items-center gap-1.5">
                    <span>{cat.icon}</span>
                    <span>{cat.tag}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-[#3D272A]/75 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium text-white">
                    {cat.priceFrom}
                  </div>
                </div>

                {/* Title & Emoji */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{cat.icon}</span>
                  <h3 className="font-serif text-2xl font-bold text-[#3D272A] group-hover:text-[#C0536A] transition-colors">
                    {cat.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-sm text-[#7A5B62] leading-relaxed">
                  {cat.description}
                </p>
              </div>

              {/* Bottom CTA bar */}
              <div className="mt-6 pt-4 border-t border-rose-100/70 flex items-center justify-between text-[#C0536A] text-sm font-semibold">
                <span className="group-hover:translate-x-1 transition-transform">
                  Explore {cat.title}
                </span>
                <div className="w-8 h-8 rounded-full bg-[#FFE3E8] group-hover:bg-[#D96B82] group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Romantic banner highlight */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-[#FFE3E8] via-[#FFF0F3] to-[#FFE3E8] p-6 sm:p-8 border border-[#F4A6B7]/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl shrink-0">
              🧶
            </div>
            <div>
              <h4 className="font-serif text-lg sm:text-xl font-bold text-[#3D272A]">
                Looking for something tailor-made for a loved one?
              </h4>
              <p className="text-xs sm:text-sm text-[#7A5B62]">
                Custom color palettes, personalized letters, and custom floral combinations available upon request.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectCategory('customize')}
            className="shrink-0 px-6 py-3 rounded-full bg-[#D96B82] hover:bg-[#C0536A] text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow transition-all"
          >
            Create Custom Crochet
          </button>
        </div>

      </div>
    </section>
  );
};
