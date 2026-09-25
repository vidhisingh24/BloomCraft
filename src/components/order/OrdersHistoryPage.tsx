import React, { useEffect, useState } from 'react';
import type { Order } from '../../types';
import { orderService } from '../../services/orderService';
import { formatPaise } from '../../utils/currency';
import { formatISTDate } from '../../utils/date';
import { 
  Package, 
  Clock, 
  FileText, 
  ArrowRight, 
  ShoppingBag
} from 'lucide-react';

interface OrdersHistoryPageProps {
  onSelectOrder: (order: Order) => void;
  onViewReceipt: (order: Order) => void;
  onShopNow: () => void;
}

export const OrdersHistoryPage: React.FC<OrdersHistoryPageProps> = ({
  onSelectOrder,
  onViewReceipt,
  onShopNow,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    orderService.getAll().then((data) => {
      setOrders(data);
      setIsLoading(false);
    });
  }, []);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'placed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Received</span>;
      case 'confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Confirmed</span>;
      case 'preparing':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">In Crafting</span>;
      case 'ready':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Ready for Pickup</span>;
      case 'shipped':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Dispatched</span>;
      case 'delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">Delivered 🌸</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-50 text-gray-700">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-12 h-12 border-3 border-[#D96B82] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-[#7A5B62]">Loading your BloomCraft order history...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#FFE3E8] flex items-center justify-center text-[#D96B82]">
          <Package className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#3D272A]">No Orders Placed Yet</h2>
        <p className="text-sm text-[#7A5B62] max-w-sm mx-auto">
          You haven't placed any handmade crochet orders on this device yet. Explore our handcrafted creations!
        </p>
        <button
          onClick={onShopNow}
          className="px-8 py-3.5 rounded-full bg-[#D96B82] text-white font-medium hover:bg-[#C0536A] shadow-md transition-all inline-flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" /> Browse Shop 🌸
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F0E6E8]">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#D96B82]">Your Account</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#3D272A]">My Order History</h1>
        </div>
        <button
          onClick={onShopNow}
          className="text-xs font-bold text-[#D96B82] hover:text-[#C0536A] flex items-center gap-1 transition-colors"
        >
          Shop More Blooms <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl p-5 sm:p-6 border border-[#F0E6E8] shadow-sm hover:shadow-md transition-all space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F5EDEF]">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm text-[#3D272A]">{order.id}</span>
                <span className="text-xs text-[#A38B90]">• {formatISTDate(order.createdAt)}</span>
              </div>
              <div>{getStatusBadge(order.status)}</div>
            </div>

            {/* Items preview */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {order.items.slice(0, 4).map((item, i) => (
                  <img
                    key={i}
                    src={item.image || '/images/keychains/tulip_pink_duo.jpg'}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover bg-[#FFE3E8]/30 border border-[#EBD8DC] shrink-0"
                  />
                ))}
                {order.items.length > 4 && (
                  <span className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#EBD8DC] flex items-center justify-center text-xs font-bold text-[#7A5B62] shrink-0">
                    +{order.items.length - 4}
                  </span>
                )}
                <div className="ml-2 text-xs text-[#7A5B62]">
                  <p className="font-semibold text-[#3D272A]">{order.items[0]?.name}</p>
                  <p>{order.items.length} item{order.items.length !== 1 ? 's' : ''} • {formatPaise(order.pricing.total)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => onViewReceipt(order)}
                  className="px-3.5 py-2 rounded-full bg-[#FAF8F5] border border-[#EBD8DC] text-xs font-semibold text-[#3D272A] hover:bg-[#FFE3E8] transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#D96B82]" /> Receipt
                </button>
                <button
                  onClick={() => onSelectOrder(order)}
                  className="px-4 py-2 rounded-full bg-[#D96B82] text-white text-xs font-bold hover:bg-[#C0536A] shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" /> Track Status
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
