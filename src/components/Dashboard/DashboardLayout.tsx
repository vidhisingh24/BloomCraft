import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, 
  ShoppingBag, 
  MessageSquareHeart, 
  Package, 
  Truck, 
  ArrowLeft, 
  Menu, 
  X, 
  RefreshCw
} from 'lucide-react';
import type { Order, CustomRequest, Product, OrderStatus } from '../../types';
import { orderService } from '../../services/orderService';
import { customRequestService } from '../../services/customRequestService';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';

import { DashboardOverview } from './DashboardOverview';
import { OrdersManager } from './OrdersManager';
import { CustomRequestsView } from './CustomRequestsView';
import { ProductsManager } from './ProductsManager';
import { DeliveryManager } from './DeliveryManager';

interface DashboardLayoutProps {
  onExitDashboard: () => void;
}

export type TabType = 'overview' | 'orders' | 'custom' | 'products' | 'delivery';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onExitDashboard }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Service State
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useToast();

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedOrders, fetchedRequests, fetchedProducts] = await Promise.all([
        orderService.getAll(),
        customRequestService.getAll(),
        productService.getAll(),
      ]);
      setOrders(fetchedOrders);
      setCustomRequests(fetchedRequests);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    try {
      const updated = await orderService.updateStatus(orderId, newStatus, note);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast('Order Status Updated 🌸', `Order #${orderId} set to "${newStatus}"`, 'cart');
    } catch (err: any) {
      showToast('Error Updating Status', err.message, 'info');
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: any) => {
    try {
      const updated = await orderService.updatePaymentStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast('Payment Verified', `Order #${orderId} marked as ${status}`, 'cart');
    } catch (err: any) {
      showToast('Error', err.message, 'info');
    }
  };

  const handleUpdateCustomStatus = async (requestId: string, newStatus: CustomRequest['status']) => {
    try {
      const updated = await customRequestService.updateStatus(requestId, newStatus);
      setCustomRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
      showToast('Request Status Updated', `Request #${requestId} set to "${newStatus}"`, 'cart');
    } catch (err: any) {
      showToast('Error', err.message, 'info');
    }
  };

  const handleUpdateCustomQuote = async (requestId: string, quotedPrice: number, notes?: string) => {
    try {
      const updated = await customRequestService.updateQuote(requestId, quotedPrice, notes);
      setCustomRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
      showToast('Quote Sent! 🌸', `Quoted ₹${quotedPrice} for #${requestId}`, 'cart');
    } catch (err: any) {
      showToast('Error', err.message, 'info');
    }
  };

  const handleToggleProductAvailability = async (productId: string, newAvail: Product['availability']) => {
    try {
      const updated = await productService.updateAvailability(productId, newAvail);
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      showToast('Product Availability Updated', `${updated.name} set to "${newAvail}"`, 'cart');
    } catch (err: any) {
      showToast('Error', err.message, 'info');
    }
  };

  const handleUpdateProductPrice = async (productId: string, pricePaise: number) => {
    try {
      const updated = await productService.updatePrice(productId, pricePaise);
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      showToast('Price Updated', `${updated.name} updated to ₹${pricePaise / 100}`, 'cart');
    } catch (err: any) {
      showToast('Error', err.message, 'info');
    }
  };

  const pendingOrdersCount = orders.filter((o) => o.status === 'placed' || o.status === 'confirmed').length;
  const newRequestsCount = customRequests.filter((c) => c.status === 'received').length;

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Home className="w-4 h-4" /> },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: pendingOrdersCount || undefined
    },
    { 
      id: 'custom', 
      label: 'Custom Requests', 
      icon: <MessageSquareHeart className="w-4 h-4" />,
      badge: newRequestsCount || undefined
    },
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { id: 'delivery', label: 'Delivery Hub', icon: <Truck className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3D272A] flex flex-col md:flex-row relative">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FFFDFB] border-b border-[#F4A6B7]/30 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/40 flex items-center justify-center text-[#D96B82] text-sm font-bold">
            🌸
          </div>
          <div>
            <span className="font-serif text-lg font-bold text-[#3D272A] leading-tight block">
              BLOOMCRAFT
            </span>
            <span className="text-[10px] text-[#C0536A] font-semibold tracking-wider uppercase">
              Maker Studio Hub
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExitDashboard}
            className="p-1.5 rounded-lg text-xs font-semibold text-[#7A5B62] bg-[#FAF8F5] border border-[#EBD8DC] flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Shop
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#3D272A] hover:bg-[#FFE3E8]/40"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#FFFDFB] border-r border-[#F4A6B7]/30 p-5 shrink-0 justify-between min-h-screen sticky top-0">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FFE3E8] to-[#FFF0F3] border border-[#F4A6B7]/40 flex items-center justify-center text-xl shadow-xs">
              🌸
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold tracking-tight text-[#3D272A]">
                BLOOMCRAFT
              </h2>
              <span className="text-[10px] font-bold text-[#D96B82] uppercase tracking-widest block">
                Maker Studio
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#FFE3E8] text-[#C0536A] shadow-xs'
                      : 'text-[#7A5B62] hover:bg-[#FFF0F3] hover:text-[#3D272A]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D96B82] text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="space-y-3 pt-6 border-t border-[#F4A6B7]/20">
          <button
            onClick={loadDashboardData}
            className="w-full py-2 px-3 rounded-xl border border-[#EBD8DC] text-xs font-semibold text-[#7A5B62] hover:bg-[#FFF0F3] transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Live Data</span>
          </button>

          <button
            onClick={onExitDashboard}
            className="w-full py-2.5 px-4 rounded-full bg-[#3D272A] text-white text-xs font-bold hover:bg-[#2A1A1C] shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#FFE3E8]" />
            <span>Back to Storefront</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {activeTab === 'overview' && (
          <DashboardOverview
            orders={orders}
            customRequests={customRequests}
            products={products}
            onNavigateTab={(tab) => setActiveTab(tab as TabType)}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersManager
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
          />
        )}

        {activeTab === 'custom' && (
          <CustomRequestsView
            customRequests={customRequests}
            onUpdateCustomStatus={handleUpdateCustomStatus}
            onUpdateQuote={handleUpdateCustomQuote}
          />
        )}

        {activeTab === 'products' && (
          <ProductsManager
            products={products}
            onToggleProductStock={(id) => {
              const p = products.find((pr) => pr.id === id);
              if (p) {
                const nextAvail = p.availability === 'out_of_stock' ? 'in_stock' : 'out_of_stock';
                handleToggleProductAvailability(id, nextAvail);
              }
            }}
            onUpdatePrice={handleUpdateProductPrice}
          />
        )}

        {activeTab === 'delivery' && (
          <DeliveryManager
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#F0E6E8] px-2 py-2 flex items-center justify-around z-40 shadow-lg">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all relative ${
                isActive ? 'text-[#D96B82] font-bold' : 'text-[#7A5B62]'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#D96B82] text-white text-[9px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
