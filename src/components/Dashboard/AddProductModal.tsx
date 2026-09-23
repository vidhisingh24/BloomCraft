import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { DashboardProduct, ProductCategory } from '../../data/dashboardData';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: DashboardProduct) => void;
}

const PRESET_IMAGES = [
  { label: 'Crochet Flower Pot', url: 'https://images.unsplash.com/photo-1567653418876-5bb0e566e1c2?auto=format&fit=crop&w=400&q=80' },
  { label: 'Pastel Tulip Bundle', url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=400&q=80' },
  { label: 'Cute Amigurumi Bear', url: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=400&q=80' },
  { label: 'Daisy Keychain', url: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=400&q=80' },
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Keychains');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(PRESET_IMAGES[0].url);
  const [description, setDescription] = useState('');
  const [inStock, setInStock] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const newProd: DashboardProduct = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      category,
      price: Number(price) || 199,
      image: image.trim() || PRESET_IMAGES[0].url,
      inStock,
      description: description.trim() || 'Handmade with 100% premium milk cotton yarn.',
      tags: ['New Craft', 'Handmade'],
    };

    onAddProduct(newProd);
    onClose();
    setName('');
    setPrice('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#FFFDFB] rounded-3xl border border-[#F4A6B7]/40 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F4A6B7]/20 bg-[#FFF0F3]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFE3E8] text-[#D96B82] flex items-center justify-center text-sm font-semibold">
              🌸
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#3D272A]">Add New Handmade Product</h3>
              <p className="text-xs text-[#7A5B62]">List a new crochet creation in your store catalogue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#7A5B62] hover:text-[#C0536A] hover:bg-[#FFE3E8]/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A5B62] mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pastel Cherry Keychain, Lilac Peony Stem..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#F4A6B7]/40 text-sm text-[#3D272A] placeholder-[#A4838B] focus:outline-none focus:ring-2 focus:ring-[#D96B82]/50"
            />
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A5B62] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#F4A6B7]/40 text-sm text-[#3D272A] focus:outline-none focus:ring-2 focus:ring-[#D96B82]/50"
              >
                <option value="Keychains">Keychains</option>
                <option value="Bouquets">Bouquets</option>
                <option value="Other Crochet">Other Crochet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A5B62] mb-1.5">
                Price (₹) *
              </label>
              <input
                type="number"
                required
                placeholder="299"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#F4A6B7]/40 text-sm text-[#3D272A] placeholder-[#A4838B] focus:outline-none focus:ring-2 focus:ring-[#D96B82]/50"
              />
            </div>
          </div>

          {/* Image Presets & Custom URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A5B62] mb-1.5">
              Product Image Preview
            </label>
            <div className="flex items-center gap-3 mb-2">
              <img
                src={image}
                alt="Preview"
                className="w-14 h-14 rounded-2xl object-cover border border-[#F4A6B7]/40 bg-[#FFF0F3]"
              />
              <div className="flex-1">
                <input
                  type="url"
                  placeholder="Paste direct image link..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#F4A6B7]/30 text-xs text-[#3D272A] placeholder-[#A4838B] focus:outline-none focus:ring-1 focus:ring-[#D96B82]"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImage(preset.url)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFE3E8]/80 hover:bg-[#D96B82] hover:text-white text-[#C0536A] transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A5B62] mb-1.5">
              Handmade Yarn Notes / Description
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Crafted with 100% hypoallergenic milk cotton, includes golden clasp..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl bg-white border border-[#F4A6B7]/40 text-xs text-[#3D272A] placeholder-[#A4838B] focus:outline-none focus:ring-2 focus:ring-[#D96B82]/50 resize-none"
            />
          </div>

          {/* Stock Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF0F3]/50 border border-[#F4A6B7]/30">
            <div>
              <p className="text-xs font-semibold text-[#3D272A]">Available in Stock</p>
              <p className="text-[11px] text-[#7A5B62]">Allow customers to view and order this creation</p>
            </div>
            <button
              type="button"
              onClick={() => setInStock(!inStock)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                inStock ? 'bg-[#D96B82]' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  inStock ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F4A6B7]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#7A5B62] hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#D96B82] hover:bg-[#C0536A] shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save & Publish Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
