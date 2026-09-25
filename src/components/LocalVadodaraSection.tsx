import { MapPin, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';

interface LocalVadodaraSectionProps {
  onSelectLocalPickup: () => void;
  onSelectCollegeDelivery: () => void;
}

export const LocalVadodaraSection: React.FC<LocalVadodaraSectionProps> = ({
  onSelectLocalPickup,
  onSelectCollegeDelivery,
}) => {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-[#FAF8F5] via-[#FFF5F7] to-[#FAF8F5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE3E8] text-[#D96B82] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Made Locally with Love
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#3D272A]">
            The Vadodara & College Experience 🌸
          </h2>
          <p className="text-sm text-[#7A5B62]">
            Crafted right here in Vadodara, Gujarat. We offer special free local handovers and campus deliveries for our student community.
          </p>
        </div>

        {/* 2 Feature Experience Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Vadodara Local Pickup */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F0E6E8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFE3E8]/40 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] flex items-center justify-center text-[#D96B82] group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D96B82]">Zero Shipping Fee</span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#3D272A] mt-0.5">
                  Local to Vadodara? 🌸
                </h3>
              </div>

              <p className="text-sm text-[#7A5B62] leading-relaxed">
                Meet the Bloomcraft maker and arrange a convenient pickup or meeting point for your order across Alkapuri, Fatehgunj, Gotri, Manjalpur, or any neighborhood.
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-[#F5EDEF] relative z-10">
              <button
                onClick={onSelectLocalPickup}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#D96B82] text-white font-semibold text-xs sm:text-sm hover:bg-[#C0536A] shadow-md transition-all flex items-center justify-center gap-2 group-hover:gap-3"
              >
                Arrange Local Pickup <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: College Campus Delivery */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F0E6E8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E7F7EE]/60 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#E7F7EE] flex items-center justify-center text-[#0A7B3E] group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#0A7B3E]">Campus Special Handover</span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#3D272A] mt-0.5">
                  Ordering for your college? 🏫
                </h3>
              </div>

              <p className="text-sm text-[#7A5B62] leading-relaxed">
                Studying at MSU, Parul, Navrachana, ITM, GSFC, SVIT or other Vadodara institutes? We hand-deliver your crochet bouquets and charms right to your campus gate.
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-[#F5EDEF] relative z-10">
              <button
                onClick={onSelectCollegeDelivery}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#3D272A] text-white font-semibold text-xs sm:text-sm hover:bg-[#2A1A1C] shadow-md transition-all flex items-center justify-center gap-2 group-hover:gap-3"
              >
                Choose College Delivery <ArrowRight className="w-4 h-4 text-[#FFE3E8]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
