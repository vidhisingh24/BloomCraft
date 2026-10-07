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
  RefreshCw,
  BellRing,
  LogOut
} from 'lucide-react';
import type { Order, CustomRequest, Product, OrderStatus } from '../../types';
import { orderService } from '../../services/orderService';
import { customRequestService } from '../../services/customRequestService';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import { friendlyError } from '../../lib/supabase';
import { PageLoader } from '../../components/feedback/PageLoader';
import { askNotificationPermission, canNotify, orderAlertText, playChime, systemNotify } from './newOrderAlert';

import { DashboardOverview } from './DashboardOverview';
import { OrdersManager } from './OrdersManager';
import { CustomRequestsView } from './CustomRequestsView';
import { ProductsManager } from './ProductsManager';
import { DeliveryManager } from './DeliveryManager';

interface DashboardLayoutProps {
  onExitDashboard: () => void;
  onLogout?: () => void;
}

export type TabType = 'overview' | 'orders' | 'custom' | 'products' | 'delivery';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onExitDashboard, onLogout }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Service State
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { showToast } = useToast();
  const { reload: reloadCatalog } = useCatalog();
  const [alertsOn, setAlertsOn] = useState(canNotify());
  const [savingIds, setSavingIds] = useState<ReadonlySet<string>>(new Set());

  /** Runs one save per record at a time; repeat clicks while it is saving are ignored. */
  const withSaving = async (id: string, task: () => Promise<void>) => {
    if (savingIds.has(id)) return;
    setSavingIds((prev) => new Set(prev).add(id));
    try {
      await task();
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

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
      setHasLoaded(true);
    } catch (err) {
      showToast('Could not load the studio', friendlyError(err), 'info');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Live feed: new orders and custom requests arrive here the moment they are placed.
  useEffect(() => {
    const stopOrders = orderService.subscribe((order, event) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === order.id);
        if (event === 'INSERT' && !exists) return [order, ...prev];
        return prev.map((o) => (o.id === order.id ? order : o));
      });
      if (event === 'INSERT') {
        const { title, body } = orderAlertText(order);
        playChime();
        systemNotify(title, body);
        showToast(title, body, 'cart');
      }
    });
    const stopRequests = customRequestService.subscribe((request) => {
      setCustomRequests((prev) => (prev.some((r) => r.id === request.id) ? prev : [request, ...prev]));
      playChime();
      systemNotify(`✨ New custom request ${request.id}`, `${request.customer.name}: ${request.description}`);
      showToast(`✨ New custom request ${request.id}`, request.customer.name, 'cart');
    });
    return () => {
      stopOrders();
      stopRequests();
    };
  }, [showToast]);

  // Tab title shows how many orders still need attention.
  useEffect(() => {
    const waiting = orders.filter(
      (o) => o.status === 'placed' || o.payment.status === 'awaiting_verification'
    ).length;
    document.title = waiting ? `(${waiting}) Maker Studio · BloomCraft` : 'Maker Studio · BloomCraft';
    return () => {
      document.title = 'BloomCraft';
    };
  }, [orders]);

  const enableAlerts = async () => {
    const ok = await askNotificationPermission();
    setAlertsOn(ok);
    showToast(
      ok ? 'Order alerts on 🔔' : 'Alerts blocked',
      ok ? 'You will get a notification for every new order.' : 'Allow notifications for this site in your browser settings.',
      'info'
    );
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, note?: string) =>
    withSaving(orderId, async () => {
      try {
        const updated = await orderService.updateStatus(orderId, newStatus, note);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        showToast('Order Status Updated 🌸', `Order #${orderId} set to "${newStatus}"`, 'cart');
      } catch (err) {
        showToast('Error Updating Status', friendlyError(err), 'info');
      }
    });

  const handleUpdatePaymentStatus = (orderId: string, status: Order['payment']['status']) =>
    withSaving(orderId, async () => {
      try {
        const updated = await orderService.updatePaymentStatus(orderId, status);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        showToast(status === 'paid' ? 'Payment confirmed ✓' : 'Payment status updated', `Order #${orderId}: ${status.replace('_', ' ')}`, 'cart');
      } catch (err) {
        showToast('Error', friendlyError(err), 'info');
      }
    });

  const handleUpdateCustomStatus = (requestId: string, newStatus: CustomRequest['status']) =>
    withSaving(requestId, async () => {
      try {
        const updated = await customRequestService.updateStatus(requestId, newStatus);
        setCustomRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
        showToast('Request Status Updated', `Request #${requestId} set to "${newStatus}"`, 'cart');
      } catch (err) {
        showToast('Error', friendlyError(err), 'info');
      }
    });

  const handleUpdateCustomQuote = (requestId: string, quotedPrice: number, notes?: string) =>
    withSaving(requestId, async () => {
      try {
        const updated = await customRequestService.updateQuote(requestId, quotedPrice, notes);
        setCustomRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
        showToast('Quote Sent! 🌸', `Quoted ₹${quotedPrice} for #${requestId}`, 'cart');
      } catch (err) {
        showToast('Error', friendlyError(err), 'info');
      }
    });

  const handleToggleProductAvailability = (productId: string, newAvail: Product['availability']) =>
    withSaving(productId, async () => {
      try {
        const updated = await productService.updateAvailability(productId, newAvail);
        setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
        reloadCatalog();
        showToast('Product Availability Updated', `${updated.name} set to "${newAvail}"`, 'cart');
      } catch (err) {
        showToast('Error', friendlyError(err), 'info');
      }
    });

  const handleUpdateProductPrice = (productId: string, pricePaise: number) =>
    withSaving(productId, async () => {
      try {
        const updated = await productService.updatePrice(productId, pricePaise);
        setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
        reloadCatalog();
        showToast('Price Updated', `${updated.name} updated to ₹${pricePaise / 100}`, 'cart');
      } catch (err) {
        showToast('Error', friendlyError(err), 'info');
      }
    });

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

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      void logout();
      onExitDashboard();
    }
  };

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
              {user?.name ? `${user.name} • Studio` : 'Maker Studio Hub'}
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
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-xs font-semibold text-[#C0536A] bg-[#FFE3E8]/80 border border-[#F4A6B7]/40 flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
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

        {/* Footer Actions & Logged-in User Profile */}
        <div className="space-y-2.5 pt-4 border-t border-[#F4A6B7]/20">
          {/* User Profile Card */}
          <div className="p-2.5 rounded-2xl bg-[#FFE3E8]/50 border border-[#F4A6B7]/30 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-white border border-[#F4A6B7]/40 flex items-center justify-center text-xs shrink-0">
                🌸
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-[#3D272A] block truncate leading-tight">
                  {user?.name || 'Studio Maker'}
                </span>
                <span className="text-[10px] text-[#7A5B62] block truncate">
                  {user?.email}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#7A5B62] hover:text-[#C0536A] hover:bg-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {!alertsOn && (
            <button
              onClick={() => void enableAlerts()}
              className="w-full py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Turn on new-order alerts</span>
            </button>
          )}

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
        {!hasLoaded && isLoading && <PageLoader label="Loading orders…" />}
        {!hasLoaded && !isLoading && (
          <div className="max-w-md mx-auto text-center py-16 space-y-3">
            <p className="text-sm text-[#7A5B62]">The studio data could not be loaded.</p>
            <button onClick={loadDashboardData} className="px-6 py-2.5 rounded-full bg-[#D96B82] text-white text-sm font-semibold">
              Try again
            </button>
          </div>
        )}
        {hasLoaded && activeTab === 'overview' && (
          <DashboardOverview
            orders={orders}
            customRequests={customRequests}
            products={products}
            onNavigateTab={(tab) => setActiveTab(tab as TabType)}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {hasLoaded && activeTab === 'orders' && (
          <OrdersManager
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
            savingIds={savingIds}
          />
        )}

        {hasLoaded && activeTab === 'custom' && (
          <CustomRequestsView
            customRequests={customRequests}
            onUpdateCustomStatus={handleUpdateCustomStatus}
            onUpdateQuote={handleUpdateCustomQuote}
          />
        )}

        {hasLoaded && activeTab === 'products' && (
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

        {hasLoaded && activeTab === 'delivery' && (
          <DeliveryManager
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            savingIds={savingIds}
          />
        )}
      </main>

      {savingIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#3D272A] text-white text-xs shadow-lg flex items-center gap-2" role="status">
          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          Saving…
        </div>
      )}

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
