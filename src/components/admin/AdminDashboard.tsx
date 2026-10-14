import React, { useState, useEffect } from 'react';
import { AdminUser } from '../../types';
import { apiGetMe, clearAuthToken, getAuthToken } from '../../services/api';
import { AdminLogin } from './AdminLogin';
import { AdminLayout, AdminTab } from './AdminLayout';
import { AdminOverview } from './AdminOverview';
import { AdminMenu } from './AdminMenu';
import { AdminBottles } from './AdminBottles';
import { AdminPrices } from './AdminPrices';
import { AdminPromotions } from './AdminPromotions';
import { AdminPromotionalPopup } from './AdminPromotionalPopup';
import { AdminBundles } from './AdminBundles';
import { AdminCustomOrder } from './AdminCustomOrder';
import { AdminContent } from './AdminContent';
import { AdminSocials } from './AdminSocials';
import { AdminContact } from './AdminContact';
import { AdminMedia } from './AdminMedia';
import { AdminUsers } from './AdminUsers';
import { AdminLogs } from './AdminLogs';
import { AdminOrders } from './AdminOrders';
import { AdminRewards } from './AdminRewards';
import { AdminMaintenance } from './AdminMaintenance';
import { AdminHealthMonitor } from './AdminHealthMonitor';
import { AdminBackupRestore } from './AdminBackupRestore';
import { AdminAntiFraud } from './AdminAntiFraud';
import { AdminReconciliation } from './AdminReconciliation';
import { AdminInventory } from './AdminInventory';
import { AdminDeployment } from './AdminDeployment';
import { AdminScheduledTasks } from './AdminScheduledTasks';
import { AdminCustomers } from './AdminCustomers';
import { AdminReportsExport } from './AdminReportsExport';
import { RefreshCwIcon } from '../ui/Icons';


export const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const checkAuth = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiGetMe();
      setUser(res.user);
    } catch {
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
  };

  const handleLoginSuccess = (loggedInUser: AdminUser) => {
    setUser(loggedInUser);
    setActiveTab('overview');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] text-center max-w-sm w-full space-y-4">
          <RefreshCwIcon className="w-10 h-10 animate-spin text-brand-red mx-auto" />
          <h2 className="font-black text-lg uppercase tracking-tight">Memverifikasi Sesi...</h2>
          <p className="text-xs font-bold text-neutral-500">Memeriksa otentikasi administrator</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToStore={() => (window.location.href = '/')}
      />
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <AdminOverview
            user={user}
            onNavigateTab={(tab: string) => setActiveTab(tab as AdminTab)}
          />
        );
      case 'health':
        return <AdminHealthMonitor />;
      case 'backups':
        return <AdminBackupRestore />;
      case 'fraud':
        return <AdminAntiFraud />;
      case 'reconciliation':
        return <AdminReconciliation />;
      case 'inventory':
        return <AdminInventory />;
      case 'customers':
        return <AdminCustomers />;
      case 'deployment':
        return <AdminDeployment />;
      case 'tasks':
        return <AdminScheduledTasks />;
      case 'reports':
        return <AdminReportsExport />;
      case 'maintenance':
        return <AdminMaintenance />;
      case 'orders':
        return <AdminOrders />;
      case 'rewards':
        return <AdminRewards />;
      case 'menu':
        return <AdminMenu />;

      case 'bottles':
        return <AdminBottles />;
      case 'prices':
        return <AdminPrices />;
      case 'promotions':
        return <AdminPromotions />;
      case 'promo_popup':
        return <AdminPromotionalPopup />;
      case 'bundles':
        return <AdminBundles />;
      case 'custom_order':
        return <AdminCustomOrder />;
      case 'content':
        return <AdminContent />;
      case 'socials':
        return <AdminSocials />;
      case 'contact':
        return <AdminContact />;
      case 'media':
        return <AdminMedia />;
      case 'users':
        return <AdminUsers />;
      case 'logs':
        return <AdminLogs />;
      default:
        return (
          <AdminOverview
            user={user}
            onNavigateTab={(tab: string) => setActiveTab(tab as AdminTab)}
          />
        );
    }
  };

  return (
    <AdminLayout
      user={user}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {renderTabContent()}
    </AdminLayout>
  );
};
