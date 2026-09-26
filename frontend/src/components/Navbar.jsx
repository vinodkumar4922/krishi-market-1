import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Sprout,
  ShoppingCart,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  Heart,
  Package,
  Bell,
  Menu,
  X,
  PhoneCall,
  HelpCircle,
  Info,
} from 'lucide-react';

const Navbar = ({ cartCount = 0 }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Ignore background notification fetch error
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-krishi-600 flex items-center justify-center text-white shadow-md group-hover:bg-krishi-700 transition">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                KRISHI <span className="text-krishi-600">MARKET</span>
              </span>
              <span className="text-[10px] block font-medium uppercase tracking-wider text-slate-400 -mt-1">
                Direct Farmer-to-Consumer
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/marketplace" className="hover:text-krishi-600 transition">
              Marketplace
            </Link>
            <Link to="/about" className="hover:text-krishi-600 transition">
              About
            </Link>
            <Link to="/faq" className="hover:text-krishi-600 transition">
              FAQ
            </Link>
            <Link to="/contact" className="hover:text-krishi-600 transition">
              Support
            </Link>

            {user?.role === 'CONSUMER' && (
              <Link to="/orders" className="hover:text-krishi-600 transition font-semibold text-slate-800">
                My Orders
              </Link>
            )}

            {user?.role === 'FARMER' && (
              <>
                <Link
                  to="/farmer/dashboard"
                  className="flex items-center gap-1.5 text-krishi-700 font-semibold bg-krishi-50 px-3 py-1.5 rounded-lg border border-krishi-200 hover:bg-krishi-100 transition"
                >
                  <LayoutDashboard className="w-4 h-4" /> Farmer Hub
                </Link>
                <Link
                  to="/inventory"
                  className="flex items-center gap-1.5 text-slate-700 hover:text-krishi-600 font-semibold transition"
                >
                  <Package className="w-4 h-4 text-krishi-600" /> Inventory
                </Link>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 text-purple-700 font-semibold bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200"
              >
                <ShieldCheck className="w-4 h-4" /> Admin Console
              </Link>
            )}
          </div>

          {/* Action buttons (Right) */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-600 hover:text-krishi-600 hover:bg-slate-100 rounded-full transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Notifications ({unreadCount} unread)
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-bold text-krishi-600 hover:text-krishi-700"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">No notifications yet</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`py-2.5 px-2 rounded-xl transition ${
                              n.read ? 'opacity-70' : 'bg-krishi-50/50 font-medium'
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-800">{n.title}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{n.message}</div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link
              to="/wishlist"
              className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            <Link
              to="/cart"
              className="relative p-2 text-slate-600 hover:text-krishi-600 hover:bg-slate-100 rounded-full transition"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-krishi-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-800">{user?.name}</div>
                  <div className="text-[10px] font-bold text-krishi-700 bg-krishi-100 px-1.5 py-0.5 rounded inline-block">
                    {user?.role}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-krishi-600 px-3 py-1.5 transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-semibold text-white bg-krishi-600 hover:bg-krishi-700 px-4 py-1.5 rounded-lg shadow-sm transition"
                >
                  Join Krishi
                </Link>
              </div>
            )}

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <Link
              to="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              Marketplace
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              About
            </Link>
            <Link
              to="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              FAQ
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              Contact & Support
            </Link>

            {user?.role === 'CONSUMER' && (
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 font-semibold text-krishi-700"
              >
                My Orders
              </Link>
            )}

            {user?.role === 'FARMER' && (
              <>
                <Link
                  to="/farmer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg bg-krishi-50 text-krishi-700 font-bold"
                >
                  Farmer Hub
                </Link>
                <Link
                  to="/inventory"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
                >
                  Inventory Management
                </Link>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-bold"
              >
                Admin Console
              </Link>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">{user?.name}</div>
                  <div className="text-[10px] font-bold text-krishi-700 bg-krishi-100 px-1.5 py-0.5 rounded inline-block">
                    {user?.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-xs font-bold text-white bg-krishi-600 rounded-lg"
                >
                  Join Krishi
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
