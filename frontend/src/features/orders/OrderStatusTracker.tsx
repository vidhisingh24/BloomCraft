import React from 'react';
import type { OrderStatus, DeliveryMethod, StatusHistoryEntry } from '../../types';
import { formatISTDateTime } from '../../utils/date';
import { Check, Clock, Package, Sparkles, Send, Home, XCircle } from 'lucide-react';

interface OrderStatusTrackerProps {
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  statusHistory?: StatusHistoryEntry[];
}

interface StepConfig {
  key: OrderStatus;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  status,
  deliveryMethod,
  statusHistory = [],
}) => {
  const isParcel = deliveryMethod === 'parcel';

  const steps: StepConfig[] = isParcel
    ? [
        { key: 'placed', label: 'Order Placed', desc: 'Received & Queued', icon: Clock },
        { key: 'confirmed', label: 'Confirmed', desc: 'Crafting scheduled', icon: Check },
        { key: 'preparing', label: 'In Crafting', desc: 'Yarn work in progress', icon: Sparkles },
        { key: 'shipped', label: 'Shipped', desc: 'In courier transit', icon: Send },
        { key: 'delivered', label: 'Delivered', desc: 'Arrived safely', icon: Home },
      ]
    : [
        { key: 'placed', label: 'Order Placed', desc: 'Received & Queued', icon: Clock },
        { key: 'confirmed', label: 'Confirmed', desc: 'Handover scheduled', icon: Check },
        { key: 'preparing', label: 'In Crafting', desc: 'Yarn work in progress', icon: Sparkles },
        { key: 'ready', label: 'Ready', desc: 'Ready for meeting', icon: Package },
        { key: 'delivered', label: 'Handed Over', desc: 'Delivered with joy', icon: Home },
      ];

  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h4 className="font-serif font-bold text-red-800 text-lg">Order Cancelled</h4>
        <p className="text-xs text-red-600 max-w-sm mx-auto mt-1">
          This order has been cancelled. If you have questions or need assistance, feel free to contact us on WhatsApp.
        </p>
      </div>
    );
  }

  const stepOrder = steps.map((s) => s.key);
  const currentIndex = stepOrder.indexOf(status);

  // Helper to find timestamp from history
  const getHistoryEntry = (stepKey: OrderStatus) => {
    return statusHistory.find((h) => h.status === stepKey);
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#F0E6E8] shadow-sm">
      <div className="mb-6">
        <span className="text-xs uppercase font-bold tracking-widest text-[#D96B82]">Live Status</span>
        <h3 className="text-lg sm:text-xl font-serif font-bold text-[#3D272A] mt-0.5">
          Order Progress Tracking
        </h3>
      </div>

      {/* Desktop Horizontal Tracker */}
      <div className="hidden md:block">
        <div className="relative flex items-center justify-between">
          {/* Connector Line */}
          <div className="absolute top-6 left-8 right-8 h-1 bg-[#F5EDEF] -translate-y-1/2 z-0" />
          <div
            className="absolute top-6 left-8 h-1 bg-[#D96B82] -translate-y-1/2 z-0 transition-all duration-500"
            style={{
              width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%`,
            }}
          />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentIndex >= idx;
            const isCurrent = currentIndex === idx;
            const history = getHistoryEntry(step.key);

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center text-center max-w-[120px]">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? 'bg-[#3D272A] text-white ring-4 ring-[#FFE3E8] shadow-lg scale-110'
                      : isCompleted
                      ? 'bg-[#D96B82] text-white shadow-md'
                      : 'bg-white text-[#C4B2B6] border-2 border-[#EBD8DC]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span
                  className={`text-xs font-bold mt-3 ${
                    isCurrent ? 'text-[#3D272A]' : isCompleted ? 'text-[#D96B82]' : 'text-[#A38B90]'
                  }`}
                >
                  {step.label}
                </span>

                <span className="text-[10px] text-[#7A5B62] mt-0.5 leading-tight">
                  {step.desc}
                </span>

                {history && (
                  <span className="text-[9px] text-[#A38B90] mt-1 font-mono">
                    {formatISTDateTime(history.at)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Tracker */}
      <div className="md:hidden space-y-6 relative pl-4">
        {/* Vertical Connector Line */}
        <div className="absolute top-4 bottom-4 left-7 w-0.5 bg-[#F5EDEF] z-0" />

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = currentIndex >= idx;
          const isCurrent = currentIndex === idx;
          const history = getHistoryEntry(step.key);

          return (
            <div key={step.key} className="relative z-10 flex items-start gap-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-[#3D272A] text-white ring-4 ring-[#FFE3E8] shadow-md scale-105'
                    : isCompleted
                    ? 'bg-[#D96B82] text-white'
                    : 'bg-white text-[#C4B2B6] border border-[#EBD8DC]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 pt-0.5">
                <div className="flex items-baseline justify-between">
                  <h4
                    className={`text-sm font-bold ${
                      isCurrent ? 'text-[#3D272A]' : isCompleted ? 'text-[#D96B82]' : 'text-[#A38B90]'
                    }`}
                  >
                    {step.label}
                  </h4>
                  {history && (
                    <span className="text-[10px] text-[#A38B90] font-mono">
                      {formatISTDateTime(history.at)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#7A5B62] mt-0.5">{step.desc}</p>
                {history?.note && (
                  <p className="text-[11px] text-[#A38B90] italic mt-0.5">
                    "{history.note}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
