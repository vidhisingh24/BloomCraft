import React, { useState } from 'react';
import { 
  Home, 
  ShoppingBag, 
  MessageSquareHeart, 
  Package, 
  Truck, 
  Settings, 
  ArrowLeft, 
  Menu, 
  X, 
  Plus
} from 'lucide-react';
import { 
  INITIAL_ORDERS, 
  INITIAL_CUSTOM_REQUESTS, 
  INITIAL_PRODUCTS, 
  type DashboardOrder, 
  type DashboardCustomRequest, 
  type DashboardProduct, 
  type OrderStatus, 
  type CustomRequestStatus 
} from '../../data/dashboardData';
import { DashboardOverview } from './DashboardOverview';
import { OrdersManager } from './OrdersManager';
import { CustomRequestsView } from './CustomRequestsView';
import { ProductsManager } from './ProductsManager';
import { DeliveryManager } from './DeliveryManager';
import { AddProductModal } from './AddProductModal';
import { SettingsModal } from './SettingsModal';

interface DashboardLayoutProps {
  onExitDashboard: () => void;
}

type TabType = 'overview' | 'orders' | 'custom' | 'products' | 'delivery';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onExitDashboard }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Core state for live maker interaction
  const [orders, setOrders] = useState<DashboardOrder[]>(INITIAL_ORDERS);
  const [customRequests, setCustomRequests] = useState<DashboardCustomRequest[]>(INITIAL_CUSTOM_REQUESTS);
  const [products, setProducts] = useState<DashboardProduct[]>(INITIAL_PRODUCTS);

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleUpdateCustomStatus = (requestId: string, newStatus: CustomRequestStatus) => {
    setCustomRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
    );
  };

  const handleToggleProductStock = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, inStock: !p.inStock } : p))
    );
  };

  const handleAddProduct = (newProduct: DashboardProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Home className="w-4 h-4" /> },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: orders.filter((o) => o.status === 'New').length || undefined
    },
    { 
      id: 'custom', 
      label: 'Custom Requests', 
      icon: <MessageSquareHeart className="w-4 h-4" />,
      badge: customRequests.filter((c) => c.status === 'New Request').length || undefined
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
            <span className="text-[10px] text-[#A4838B] font-semibold uppercase tracking-wider block">
              Maker Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddProductOpen(true)}
            className="p-2 rounded-full bg-[#D96B82] text-white"
            title="Add Product"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full bg-[#FFE3E8] text-[#C0536A]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#FFFDFB] border-r border-[#F4A6B7]/30 flex flex-col justify-between p-5 transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Logo & Studio Title */}
          <div className="flex items-center gap-2.5 pb-6 border-b border-[#F4A6B7]/20">
            <div className="w-10 h-10 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/40 flex items-center justify-center text-[#D96B82] shadow-sm">
              <span className="text-xl">🌸</span>
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-wider text-[#3D272A] block leading-none">
                BLOOMCRAFT
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#C0536A] font-bold block mt-1">
                Maker Studio
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FFE3E8] text-[#C0536A] shadow-sm font-bold'
                      : 'text-[#7A5B62] hover:text-[#C0536A] hover:bg-[#FFF0F3]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-[#D96B82] text-white text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="pt-6 border-t border-[#F4A6B7]/20 space-y-2">
          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold text-[#7A5B62] hover:text-[#3D272A] hover:bg-[#FFF0F3] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Studio Settings</span>
          </button>

          {/* View Website Button (Return to customer store) */}
          <button
            onClick={onExitDashboard}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#D96B82] hover:bg-[#C0536A] shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Website</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {activeTab === 'overview' && (
          <DashboardOverview
            orders={orders}
            customRequests={customRequests}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersManager
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === 'custom' && (
          <CustomRequestsView
            customRequests={customRequests}
            onUpdateStatus={handleUpdateCustomStatus}
          />
        )}

        {activeTab === 'products' && (
          <ProductsManager
            products={products}
            onToggleStock={handleToggleProductStock}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
          />
        )}

        {activeTab === 'delivery' && (
          <DeliveryManager orders={orders} />
        )}
      </main>

      {/* Modals */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAddProduct={handleAddProduct}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;
