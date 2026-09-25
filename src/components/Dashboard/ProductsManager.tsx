import React, { useState } from 'react';
import { 
  Search,
  Check,
  Edit2
} from 'lucide-react';
import type { Product } from '../../types';
import { formatPaise } from '../../utils/currency';

interface ProductsManagerProps {
  products: Product[];
  onToggleProductStock: (productId: string) => void;
  onUpdatePrice: (productId: string, pricePaise: number) => void;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  products,
  onToggleProductStock,
  onUpdatePrice,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPriceInput, setTempPriceInput] = useState<string>('');

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'keychain', label: 'Keychains' },
    { id: 'bouquet', label: 'Bouquets' },
    { id: 'other', label: 'Other Charms' },
  ];

  const filteredProducts = products.filter((prod) => {
    const matchesCategory = activeCategory === 'all' || prod.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      prod.name.toLowerCase().includes(q) ||
      prod.tags.some((t) => t.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  const handleStartEditPrice = (prod: Product) => {
    setEditingPriceId(prod.id);
    setTempPriceInput((prod.price / 100).toString());
  };

  const handleSavePrice = (productId: string) => {
    const parsedRupees = parseFloat(tempPriceInput);
    if (!isNaN(parsedRupees) && parsedRupees > 0) {
      onUpdatePrice(productId, Math.round(parsedRupees * 100));
    }
    setEditingPriceId(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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

        <div className="text-xs text-[#7A5B62] bg-[#FFF0F3] px-3.5 py-2 rounded-xl border border-[#F4A6B7]/30">
          <span className="font-bold text-[#D96B82]">{filteredProducts.length}</span> items
        </div>
      </div>

      {/* Category Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#FFF0F3]/70 border border-[#F4A6B7]/30">
          {categories.map((cat) => {
            const count =
              cat.id === 'all' ? products.length : products.filter((p) => p.category === cat.id).length;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-[#C0536A] shadow-xs border border-[#F4A6B7]/40'
                    : 'text-[#7A5B62] hover:text-[#C0536A] hover:bg-white/50'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[#FFE3E8] text-[#C0536A]' : 'bg-white text-[#7A5B62]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#A38B90] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#EBD8DC] bg-white focus:outline-none focus:border-[#D96B82]"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product) => {
          const isEditingPrice = editingPriceId === product.id;

          return (
            <div
              key={product.id}
              className="bg-white rounded-3xl p-4 border border-[#F0E6E8] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#FFF0F3]">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 bg-white/95 rounded-full text-[10px] font-bold text-[#C0536A] shadow-xs uppercase">
                      {product.category}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-sm text-[#3D272A] line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-[#7A5B62] line-clamp-2 mt-0.5">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Price Editing & Stock Toggle */}
              <div className="pt-3 border-t border-[#F5EDEF] space-y-2">
                <div className="flex items-center justify-between">
                  {isEditingPrice ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold">₹</span>
                      <input
                        type="number"
                        value={tempPriceInput}
                        onChange={(e) => setTempPriceInput(e.target.value)}
                        className="w-20 px-2 py-1 text-xs border rounded-lg"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSavePrice(product.id)}
                        className="p-1 rounded bg-[#D96B82] text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif font-bold text-base text-[#3D272A]">
                        {formatPaise(product.price)}
                      </span>
                      <button
                        onClick={() => handleStartEditPrice(product)}
                        className="text-[#A38B90] hover:text-[#D96B82] p-1"
                        title="Edit Price"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => onToggleProductStock(product.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                      product.availability === 'out_of_stock'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {product.availability === 'out_of_stock' ? 'Out of Stock' : 'In Stock ✓'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
