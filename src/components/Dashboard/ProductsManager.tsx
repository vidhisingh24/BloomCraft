import React, { useState } from 'react';
import { 
  Plus, 
  Search
} from 'lucide-react';
import type { DashboardProduct } from '../../data/dashboardData';

interface ProductsManagerProps {
  products: DashboardProduct[];
  onToggleStock: (productId: string) => void;
  onOpenAddProduct: () => void;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  products,
  onToggleStock,
  onOpenAddProduct,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Keychains', 'Bouquets', 'Other Crochet'];

  const filteredProducts = products.filter((prod) => {
    const matchesCategory = activeCategory === 'All' || prod.category === activeCategory;
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F4A6B7]/20">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A] tracking-tight">
            Handmade Product Catalogue
          </h1>
          <p className="text-sm text-[#7A5B62] font-medium">
            Manage your store creations, prices, and available stock
          </p>
        </div>

        {/* Add Product Button */}
        <button
          onClick={onOpenAddProduct}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D96B82] hover:bg-[#C0536A] text-white text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Product</span>
        </button>
      </div>

      {/* Category Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#FFF0F3]/70 border border-[#F4A6B7]/30 self-start">
          {categories.map((cat) => {
            const count =
              cat === 'All' ? products.length : products.filter((p) => p.category === cat).length;
            const isActive = activeCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#C0536A] shadow-sm border border-[#F4A6B7]/40'
                    : 'text-[#7A5B62] hover:text-[#C0536A] hover:bg-white/50'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-[#FFE3E8] text-[#C0536A]' : 'bg-white/80 text-[#7A5B62]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#A4838B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white border border-[#F4A6B7]/40 text-xs text-[#3D272A] placeholder-[#A4838B] focus:outline-none focus:ring-2 focus:ring-[#D96B82]/50 shadow-sm"
          />
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="bg-white/95 rounded-3xl border border-[#F4A6B7]/30 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {/* Product Thumbnail Image */}
              <div className="relative w-full h-48 bg-[#FFF0F3] overflow-hidden">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    !prod.inStock ? 'grayscale opacity-60' : ''
                  }`}
                />
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#3D272A] font-medium text-[11px] border border-white/80 shadow-sm">
                    {prod.category}
                  </span>
                </div>

                {/* Stock Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm backdrop-blur-md ${
                      prod.inStock
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-stone-800/85 text-stone-200'
                    }`}
                  >
                    {prod.inStock ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              {/* Info Body */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-serif text-base font-bold text-[#3D272A] leading-snug">
                    {prod.name}
                  </h3>
                  <p className="font-serif text-lg font-bold text-[#C0536A] flex-shrink-0">
                    ₹{prod.price}
                  </p>
                </div>

                {prod.description && (
                  <p className="text-xs text-[#7A5B62] line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                )}

                {prod.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {prod.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#7A5B62] border border-rose-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="px-5 py-3.5 border-t border-[#F4A6B7]/20 bg-[#FFFDFB] flex items-center justify-between gap-3">
              <span className="text-xs text-[#7A5B62] font-medium">
                Status: <strong className={prod.inStock ? 'text-emerald-700' : 'text-stone-500'}>{prod.inStock ? 'In Stock' : 'Sold Out'}</strong>
              </span>

              {/* Mark Available / Unavailable Toggle Button */}
              <button
                onClick={() => onToggleStock(prod.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                  prod.inStock
                    ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300'
                    : 'bg-[#FFE3E8] hover:bg-[#D96B82] text-[#C0536A] hover:text-white border border-rose-300'
                }`}
              >
                {prod.inStock ? 'Mark Unavailable' : 'Mark Available'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
