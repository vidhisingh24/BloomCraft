import React, { useState, useRef } from 'react';
import { X, Sparkles, CheckCircle2, MessageCircle, ImagePlus, Copy, Check } from 'lucide-react';
import { customRequestService } from '../services/customRequestService';
import { buildCustomRequestMessage, buildWhatsAppLink } from '../utils/whatsapp';
import { normalizeIndianPhone } from '../utils/validation';
import { useToast } from '../context/ToastContext';
import { trackEvent } from '../utils/analytics';
import type { CustomRequest } from '../types';

export const CustomizePage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  // Form states
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [itemType, setItemType] = useState('Custom Bouquet');
  const [colorTheme, setColorTheme] = useState('Pastel Pink & Cream');
  const [customColor, setCustomColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [minBudget, setMinBudget] = useState<number | undefined>(undefined);
  const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined);
  const [neededBy, setNeededBy] = useState('');
  const [occasion, setOccasion] = useState('');
  const [description, setDescription] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<CustomRequest | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const colorPalettes = [
    { name: 'Pastel Pink & Cream', colors: ['#FFE3E8', '#FAF8F5'] },
    { name: 'Warm Sunset Glow', colors: ['#FFD166', '#EF476F'] },
    { name: 'Lavender & Lilac Mist', colors: ['#E2D4F0', '#C3B1E1'] },
    { name: 'Sage & Forest Green', colors: ['#D8E2DC', '#84A59D'] },
    { name: 'Sunflower Yellow & Cocoa', colors: ['#FFDE59', '#7F4F24'] },
    { name: 'Classic Red & White', colors: ['#E63946', '#FFFFFF'] },
    { name: 'Custom Palette (Write below)', colors: ['#CCCCCC', '#999999'] },
  ];

  // Client-side image compression helper
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (referenceImages.length + files.length > 3) {
      setErrorMsg('You can upload a maximum of 3 reference photos');
      return;
    }

    setErrorMsg('');
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Each photo must be under 5MB');
        continue;
      }
      try {
        const compressed = await compressImage(file);
        newImages.push(compressed);
      } catch (err) {
        console.error('Image compression failed:', err);
      }
    }

    setReferenceImages((prev) => [...prev, ...newImages].slice(0, 3));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!contact.trim()) {
      setErrorMsg('Please enter your phone number');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please describe your custom crochet idea');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const finalColors = colorTheme.includes('Custom') && customColor.trim()
        ? [customColor.trim()]
        : [colorTheme];

      const created = await customRequestService.create({
        customer: {
          name: name.trim(),
          phone: normalizeIndianPhone(contact) || contact.trim(),
          email: email.trim() || undefined,
        },
        itemType,
        colors: finalColors,
        quantity: Math.max(1, quantity),
        budget: { min: minBudget, max: maxBudget },
        neededBy: neededBy || undefined,
        occasion: occasion.trim() || undefined,
        description: description.trim(),
        referenceImages,
      });

      trackEvent('custom_request_submitted', {
        requestId: created.id,
        itemType: created.itemType,
      });

      setSubmittedRequest(created);
      showToast('Custom Request Submitted! 🌸', `Request #${created.id} received`, 'cart');
    } catch (err: any) {
      console.error('Custom request submission failed:', err);
      setErrorMsg(err.message || 'Could not submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForwardToWhatsApp = () => {
    if (!submittedRequest) return;
    const msg = buildCustomRequestMessage(submittedRequest);
    const url = buildWhatsAppLink(msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyId = () => {
    if (!submittedRequest) return;
    navigator.clipboard.writeText(submittedRequest.id);
    setCopiedId(true);
    showToast('Request ID Copied! 📋', submittedRequest.id, 'cart');
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleResetForm = () => {
    setSubmittedRequest(null);
    setName('');
    setContact('');
    setEmail('');
    setDescription('');
    setReferenceImages([]);
    setQuantity(1);
    setMinBudget(undefined);
    setMaxBudget(undefined);
    setNeededBy('');
    setOccasion('');
    setCustomColor('');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFE3E8] text-[#D96B82] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Bespoke Handmade Service
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#3D272A] tracking-tight mb-4">
            Design Your Custom Crochet Bloom
          </h1>
          <p className="text-sm sm:text-base text-[#7A5B62] max-w-xl mx-auto">
            From personalised floral bouquets to bespoke car charms and characters, let's bring your vision to life stitch by stitch.
          </p>
        </div>

        {/* Success Confirmation State */}
        {submittedRequest ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-[#F0E6E8] text-center space-y-6 animate-fadeIn">
            <div className="w-20 h-20 bg-[#E7F7EE] text-[#0A7B3E] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest font-bold text-[#0A7B3E]">
                Quote Request Received 🌸
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#3D272A]">
                Your Custom Request Has Been Logged!
              </h2>
              <p className="text-sm text-[#7A5B62] max-w-md mx-auto">
                Thank you, <strong>{submittedRequest.customer.name}</strong>! We have recorded your custom crochet idea in our studio queue.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 bg-[#FAF8F5] px-5 py-2.5 rounded-full border border-[#EBD8DC]">
              <span className="text-xs text-[#7A5B62]">Request Reference:</span>
              <span className="font-mono font-bold text-sm text-[#3D272A]">{submittedRequest.id}</span>
              <button
                onClick={handleCopyId}
                className="text-[#D96B82] hover:text-[#C0536A] p-1 transition-colors"
                title="Copy Request ID"
              >
                {copiedId ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="max-w-md mx-auto bg-[#FFF0F3] p-5 rounded-2xl border border-[#FFE3E8] text-left text-xs text-[#7A5B62] space-y-1.5">
              <p><strong>Item:</strong> {submittedRequest.itemType}</p>
              <p><strong>Palette:</strong> {submittedRequest.colors.join(', ')}</p>
              <p><strong>Quantity:</strong> {submittedRequest.quantity}</p>
              <p><strong>Description:</strong> "{submittedRequest.description}"</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={handleForwardToWhatsApp}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#25D366] text-white font-bold text-sm hover:bg-[#20bd5a] shadow-md transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> Send Request on WhatsApp 💬
              </button>

              <button
                onClick={handleResetForm}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#FAF8F5] border border-[#EBD8DC] text-[#7A5B62] font-semibold text-xs hover:bg-[#FFE3E8] transition-all"
              >
                Create Another Request
              </button>
            </div>
          </div>
        ) : (
          /* Custom Request Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-[#F0E6E8] space-y-8">
            
            {/* Step 1: Item Category */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3D272A]">
                1. What would you like to customize? <span className="text-[#D96B82]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'Custom Bouquet', icon: '💐' },
                  { name: 'Keychains / Car Mirror Charm', icon: '🔑' },
                  { name: 'Amigurumi Mascot', icon: '🧸' },
                  { name: 'Bespoke Floral Decor', icon: '🌸' },
                ].map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setItemType(cat.name)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      itemType === cat.name
                        ? 'border-[#D96B82] bg-[#FFF0F3] ring-2 ring-[#FFE3E8] shadow-sm'
                        : 'border-[#F0E6E8] bg-[#FAF8F5] hover:border-[#D96B82]/50'
                    }`}
                  >
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="text-xs font-semibold text-[#3D272A] leading-snug">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Color Palette */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3D272A]">
                2. Choose Color Theme or Custom Shades <span className="text-[#D96B82]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {colorPalettes.map((palette) => (
                  <button
                    key={palette.name}
                    type="button"
                    onClick={() => setColorTheme(palette.name)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      colorTheme === palette.name
                        ? 'border-[#D96B82] bg-[#FFF0F3] shadow-sm'
                        : 'border-[#F0E6E8] bg-[#FAF8F5] hover:border-[#D96B82]/50'
                    }`}
                  >
                    <span className="text-xs font-medium text-[#3D272A]">{palette.name}</span>
                    <div className="flex -space-x-1 shrink-0">
                      {palette.colors.map((c, i) => (
                        <span
                          key={i}
                          className="w-4 h-4 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              {colorTheme.includes('Custom') && (
                <input
                  type="text"
                  placeholder="Specify exact colors (e.g. Baby Pink, Matcha Green, Lavender)"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#D96B82]"
                />
              )}
            </div>

            {/* Step 3: Description & Reference Images */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3D272A]">
                    3. Describe Your Idea <span className="text-[#D96B82]">*</span>
                  </label>
                  <span className="text-[11px] text-[#A38B90]">{description.length}/500 chars</span>
                </div>
                <textarea
                  rows={4}
                  maxLength={500}
                  placeholder="Tell us about the flower types, size, ribbon wrapping, character details, or special requests..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#EBD8DC] text-xs sm:text-sm bg-[#FAF8F5] focus:outline-none focus:border-[#D96B82] focus:ring-2 focus:ring-[#FFE3E8]"
                />
              </div>

              {/* Reference Photos Upload (Max 3) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3D272A] mb-2">
                  Upload Reference Photos <span className="text-xs font-normal text-[#A38B90]">(Up to 3 images, max 5MB each)</span>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  {referenceImages.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#EBD8DC] group">
                      <img src={img} alt="Reference" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {referenceImages.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-[#EBD8DC] bg-[#FAF8F5] hover:bg-[#FFE3E8]/40 hover:border-[#D96B82] flex flex-col items-center justify-center text-[#A38B90] transition-all cursor-pointer"
                    >
                      <ImagePlus className="w-5 h-5 text-[#D96B82] mb-1" />
                      <span className="text-[10px] font-semibold">Add Photo</span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Step 4: Quantity, Budget & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3D272A] mb-1.5">
                  Quantity
                </label>
                <div className="flex items-center bg-[#FAF8F5] rounded-xl border border-[#EBD8DC] p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-[#EBD8DC] text-[#3D272A] font-bold flex items-center justify-center hover:bg-[#FFE3E8]"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-bold text-sm text-[#3D272A]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-[#EBD8DC] text-[#3D272A] font-bold flex items-center justify-center hover:bg-[#FFE3E8]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3D272A] mb-1.5">
                  Target Budget (₹) <span className="text-[10px] font-normal text-[#A38B90]">(Optional)</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={minBudget || ''}
                    onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-2.5 rounded-xl border border-[#EBD8DC] text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#D96B82]"
                  />
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={maxBudget || ''}
                    onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-2.5 rounded-xl border border-[#EBD8DC] text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#D96B82]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3D272A] mb-1.5">
                  Needed By Date <span className="text-[10px] font-normal text-[#A38B90]">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EBD8DC] text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#D96B82]"
                />
              </div>
            </div>

            {/* Step 5: Contact Details */}
            <div className="pt-4 border-t border-[#F0E6E8] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3D272A]">
                4. Your Contact Details <span className="text-[#D96B82]">*</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#7A5B62] font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sneha Dave"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-xs sm:text-sm bg-[#FAF8F5] focus:outline-none focus:border-[#D96B82]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#7A5B62] font-semibold mb-1">WhatsApp / Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-xs sm:text-sm bg-[#FAF8F5] focus:outline-none focus:border-[#D96B82]"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-full bg-[#D96B82] text-white font-bold text-sm sm:text-base hover:bg-[#C0536A] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recording Custom Request...
                </span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Request Custom Quote 🌸
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
