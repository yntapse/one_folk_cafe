'use client';

import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ShoppingBag, Package, BarChart3, Settings, LogOut, ChevronRight, Menu as MenuIcon, X as XIcon, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDarkModeStore } from '@/store/darkModeStore';
import { NotificationPanel } from '@/components/admin/NotificationPanel';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { id: "/dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
  { id: "/orders", label: "Orders", icon: <ShoppingBag className="w-5 h-5" /> },
  { id: "/products", label: "Products", icon: <Package className="w-5 h-5" /> },
  { id: "/analytics", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
  { id: "/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { darkMode, toggleDark } = useDarkModeStore();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border relative">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-white">
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">OF</span>
          </div>
        </div>
        {!collapsed && <span className="font-bold text-lg leading-tight truncate">One Folk<br /><span className="text-accent text-sm">Admin</span></span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3.5 top-7 w-7 h-7 bg-card border border-border rounded-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground items-center justify-center text-sidebar-foreground z-50 shadow-sm"
        >
          <ChevronRight className={cn('w-4 h-4 transition-transform', collapsed ? '' : 'rotate-180')} />
        </button>
        {mobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="md:hidden ml-auto">
            <XIcon className="w-6 h-6 text-sidebar-foreground/50" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {ADMIN_NAV.map(({ id, label, icon }) => {
          const active = location.pathname === id;
          return (
            <button
              key={id}
              onClick={() => { navigate(id); setMobileOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <span className="flex-shrink-0">{icon}</span>
              {(!collapsed || mobileOpen) && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors',
            collapsed && !mobileOpen ? 'justify-center px-0' : 'px-3'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || mobileOpen) && 'Logout'}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden md:flex h-screen sticky top-0 bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300 z-40',
        collapsed ? 'w-[72px]' : 'w-60'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween' }}
            className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border z-50 flex flex-col md:hidden shadow-2xl"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border h-16 flex items-center px-4 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground">
              <MenuIcon className="w-5 h-5" />
            </button>
            <span className="font-bold">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleDark} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground">
              {darkMode ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
            </button>
            <NotificationPanel />
          </div>
        </header>

        {/* Desktop Topbar */}
        <header className="hidden md:flex sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border h-16 items-center px-8 justify-between">
          <h1 className="font-bold text-lg">
            {ADMIN_NAV.find(n => n.id === location.pathname)?.label || 'Admin Portal'}
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={toggleDark} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors">
              {darkMode ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
            </button>
            <NotificationPanel />
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">
          <Outlet />
        </div>

        {/* Mobile overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}