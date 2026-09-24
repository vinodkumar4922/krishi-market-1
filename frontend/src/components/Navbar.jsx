import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, ShoppingCart, User, LogOut, ShieldCheck, LayoutDashboard } from 'lucide-react';

const Navbar = ({ cartCount = 0 }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
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

          {/* Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/marketplace" className="hover:text-krishi-600 transition">Marketplace</Link>
            <Link to="/about" className="hover:text-krishi-600 transition">Our Mission</Link>
            
            {user?.role === 'FARMER' && (
              <Link to="/farmer/dashboard" className="flex items-center gap-1.5 text-krishi-700 font-semibold bg-krishi-50 px-3 py-1.5 rounded-lg border border-krishi-200">
                <LayoutDashboard className="w-4 h-4" /> Farmer Hub
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link to="/admin/dashboard" className="flex items-center gap-1.5 text-purple-700 font-semibold bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                <ShieldCheck className="w-4 h-4" /> Admin Console
              </Link>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
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
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
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
              <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
