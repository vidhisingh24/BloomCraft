import React, { useState, useRef } from 'react';
import { Upload, X, Sparkles, CheckCircle2, MessageCircle } from 'lucide-react';
import { getCustomQuoteWhatsAppUrl } from '../config/siteConfig';

export const CustomizePage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [itemType, setItemType] = useState('Keychain');
  const [colorTheme, setColorTheme] = useState('Pastel Pink & Cream');
  const [customColor, setCustomColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [occasion, setOccasion] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Submission state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const colorPalettes = [
    { name: 'Pastel Pink & Cream', colors: ['#FFE3E8', '#FAF8F5'] },
    { name: 'Warm Sunset Glow', colors: ['#FFD166', '#EF476F'] },
    { name: 'Lavender & Lilac Mist', colors: ['#E2D4F0', '#C3B1E1'] },
    { name: 'Sage & Forest Green', colors: ['#D8E2DC', '#84A59D'] },
    { name: 'Sunflower Yellow & Cocoa', colors: ['#FFDE59', '#7F4F24'] },
    { name: 'Classic Red & White', colors: ['#E63946', '#FFFFFF'] },
    { name: 'Custom Palette (Write below)', colors: ['#CCCCCC', '#999999'] },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size should be less than 5MB');
        return;
      }
      setErrorMsg('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    if (!contact.trim()) {
      setErrorMsg('Please enter your phone number or email');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please describe your idea');
      return;
    }

    setErrorMsg('');
    setIsSubmitted(true);
  };

  const handleForwardToWhatsApp = () => {
    const finalColor = colorTheme.includes('Custom') && customColor ? customColor : colorTheme;
    const url = getCustomQuoteWhatsAppUrl({
      name,
      phoneOrEmail: contact,
      itemType,
      color: finalColor,
      quantity,
      occasion,
      description,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleResetForm = () => {
    setIsSubmitted(false);
    setName('');
    setContact('');
    setDescription('');
    setImagePreview(null);
    setQuantity(1);
    setOccasion('');
    setCustomColor('');
  };

  return (
    <div className="py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/40 text-[#C0536A] text-xs font-semibold mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#D96B82]" />
            <span>Bespoke Handmade Orders</span>
          </div>

          {/* Heading as requested */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D272A] tracking-tight">
            Have Something Special in Mind?
          </h1>

          <p className="text-sm sm:text-base text-[#7A5B62] mt-3 leading-relaxed">
            From favorite anime characters to personalized wedding bouquet replicas — tell us your idea and our artisan crocheters will bring it to life stitch by stitch.
          </p>
        </div>

        {/* Success Screen after submission */}
        {isSubmitted ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#F4A6B7]/40 crochet-shadow text-center animate-fadeIn max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-[#FFE3E8] rounded-full flex items-center justify-center mx-auto mb-5 text-[#D96B82]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            {/* Submission message as requested */}
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A]">
              Thank you! Your custom request has been received 🌸
            </h2>

            <p className="text-sm text-[#7A5B62] mt-3 leading-relaxed max-w-md mx-auto">
              We have noted down your handcrafted requirements for <strong>{name}</strong>. Our lead artisan will review the complexity and get back to you within 24 hours with pricing and yarn timeline!
            </p>

            {/* Summary Box */}
            <div className="mt-6 p-5 rounded-2xl bg-[#FFF0F3] border border-rose-100 text-left text-xs text-[#5C3E45] space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-[#7A5B62]">Item Type:</span>
                <span className="font-semibold text-[#3D272A]">{itemType} (Qty: {quantity})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[#7A5B62]">Color Preference:</span>
                <span className="font-semibold text-[#3D272A]">{colorTheme}</span>
              </div>
              {occasion && (
                <div className="flex justify-between">
                  <span className="font-medium text-[#7A5B62]">Occasion:</span>
                  <span className="font-semibold text-[#3D272A]">{occasion}</span>
                </div>
              )}
              <div className="pt-2 border-t border-rose-200/60">
                <span className="font-medium text-[#7A5B62] block mb-1">Your Idea:</span>
                <p className="italic text-[#3D272A] bg-white/70 p-2 rounded-lg">"{description}"</p>
              </div>
            </div>

            {/* Direct WhatsApp Action for instant response */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleForwardToWhatsApp}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Forward Request to WhatsApp Now</span>
              </button>

              <button
                onClick={handleResetForm}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white border border-rose-200 text-[#5C3E45] hover:bg-rose-50 font-semibold text-xs transition-all"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          /* Custom Order Form */
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 sm:p-10 border border-[#F4A6B7]/30 crochet-shadow space-y-8"
          >
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-[#C0536A] flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Basic Info */}
            <div>
              <h3 className="font-serif text-lg font-bold text-[#3D272A] flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-[#FFE3E8] text-[#C0536A] text-xs flex items-center justify-center">1</span>
                <span>Your Contact Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5C3E45] mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aditi Sharma"
                    className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D96B82]/40 text-sm text-[#3D272A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5C3E45] mb-1.5">
                    Phone Number or Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. +91 9876543210 or aditi@gmail.com"
                    className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D96B82]/40 text-sm text-[#3D272A]"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Product & Preferences */}
            <div>
              <h3 className="font-serif text-lg font-bold text-[#3D272A] flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-[#FFE3E8] text-[#C0536A] text-xs flex items-center justify-center">2</span>
                <span>Type & Color Preferences</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5C3E45] mb-1.5">
                    Item Category
                  </label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D96B82]/40 text-sm text-[#3D272A]"
                  >
                    <option value="Keychain">🧶 Custom Keychain</option>
                    <option value="Bouquet">💐 Floral Bouquet</option>
                    <option value="Amigurumi Plushie">🧸 Amigurumi Plush Doll</option>
                    <option value="Car Charm / Hanging">🚗 Car Mirror Hanging</option>
                    <option value="Coaster / Mat">☕ Mug Coaster / Mat</option>
                    <option value="Other">✨ Other Handmade Idea</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5C3E45] mb-1.5">
                    Quantity Needed
                  </label>
                  <div className="flex items-center border border-rose-200 rounded-2xl bg-[#FAF8F5]/60 overflow-hidden h-[46px]">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-full flex items-center justify-center text-[#5C3E45] hover:bg-[#FFE3E8] transition-colors"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold text-[#3D272A]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-10 h-full flex items-center justify-center text-[#5C3E45] hover:bg-[#FFE3E8] transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5C3E45] mb-1.5">
                    Occasion / Date Needed (Optional)
                  </label>
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="e.g. Birthday in 2 weeks"
                    className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D96B82]/40 text-sm text-[#3D272A]"
                  />
                </div>
              </div>

              {/* Color Palette Choice */}
              <div>
                <label className="block text-xs font-semibold text-[#5C3E45] mb-2">
                  Select Preferred Color Palette:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {colorPalettes.map((p) => {
                    const isSelected = colorTheme === p.name;
                    return (
                      <button
                        type="button"
                        key={p.name}
                        onClick={() => setColorTheme(p.name)}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                          isSelected
                            ? 'border-[#D96B82] bg-[#FFE3E8]/80 ring-2 ring-[#D96B82]/30'
                            : 'border-rose-100 bg-[#FAF8F5]/50 hover:bg-[#FFF0F3]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: p.colors[0] }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: p.colors[1] }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-[#3D272A] leading-tight line-clamp-1">
                          {p.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {colorTheme.includes('Custom') && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="Specify your exact colors (e.g. Mint Green & Lavender Violet)"
                      className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-xs text-[#3D272A]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Reference Image Upload */}
            <div>
              <h3 className="font-serif text-lg font-bold text-[#3D272A] flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#FFE3E8] text-[#C0536A] text-xs flex items-center justify-center">3</span>
                <span>Upload Reference Photo (Optional)</span>
              </h3>
              <p className="text-xs text-[#7A5B62] mb-3">
                Have a Pinterest pin, sketch, or photo of what you want? Upload it here.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="reference-upload"
              />

              {imagePreview ? (
                <div className="relative inline-block rounded-2xl overflow-hidden border-2 border-[#D96B82]/50 shadow-md">
                  <img
                    src={imagePreview}
                    alt="Custom Reference Preview"
                    className="w-48 h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-rose-600 flex items-center justify-center shadow-md transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-1">
                    Reference Attached 🌸
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="reference-upload"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#F4A6B7]/60 rounded-2xl bg-[#FFF5F7]/50 hover:bg-[#FFE8EC]/60 cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#D96B82] mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-[#5C3E45]">
                    Click to upload reference image
                  </span>
                  <span className="text-[11px] text-[#A4838B] mt-0.5">
                    PNG, JPG, or WEBP up to 5MB
                  </span>
                </label>
              )}
            </div>

            {/* Step 4: Idea Description */}
            <div>
              <h3 className="font-serif text-lg font-bold text-[#3D272A] flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#FFE3E8] text-[#C0536A] text-xs flex items-center justify-center">4</span>
                <span>Describe Your Idea *</span>
              </h3>

              {/* Large text box as requested */}
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your idea… (e.g. A small crochet cat keychain holding a mini daisy with initials 'S & K' stitched on the back)"
                className="w-full p-4 rounded-2xl border border-rose-200 bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D96B82]/40 text-sm text-[#3D272A] placeholder:text-[#A4838B] resize-none leading-relaxed"
              />
            </div>

            {/* Submit Button as requested */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#D96B82] to-[#C0536A] hover:from-[#c95d73] hover:to-[#ae465c] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Request Custom Quote</span>
              </button>
              <p className="text-center text-[11px] text-[#A4838B] mt-2.5">
                🌸 We usually reply with yarn availability and custom quote within a few hours.
              </p>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
