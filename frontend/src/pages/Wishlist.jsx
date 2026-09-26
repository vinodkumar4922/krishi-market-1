import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import {
  Heart,
  ShoppingBag,
  Trash2,
  CheckCircle,
  MapPin,
  Sprout,
  ArrowRight,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { formatCurrency, formatUnit } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await api.get('/consumer/wishlist');
      if (res.data.success) {
        setWishlist(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      const res = await api.delete(`/consumer/wishlist/${productId}`);
      if (res.data.success) {
        setWishlist((prev) => ({
          ...prev,
          products: prev.products.filter((p) => (p._id || p) !== productId),
        }));
        showToast('Item removed from wishlist');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToCart = (product) => {
    addToCart(product, 1);
    handleRemove(product._id);
    showToast(`${product.name} moved to cart!`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading your saved harvests..." />;
  }

  const products = wishlist?.products || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <CheckCircle className="w-5 h-5 text-krishi-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-500 fill-current" /> My Harvest Wishlist
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Produce you have bookmarked directly from regional farmers.
          </p>
        </div>
        <Link
          to="/marketplace"
          className="text-xs font-bold text-krishi-600 hover:text-krishi-700 flex items-center gap-1.5 self-start sm:self-auto"
        >
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Your wishlist is currently empty</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Explore seasonal produce in our direct marketplace and tap the heart icon to save your favorites.
          </p>
          <Link
            to="/marketplace"
            className="px-6 py-3 bg-krishi-600 hover:bg-krishi-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => {
            const isOutOfStock = p.quantity <= 0;
            const farmerName = p.farmer?.user?.name || 'Verified Farmer';

            return (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition flex flex-col overflow-hidden"
              >
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  <img
                    src={
                      p.images?.[0] ||
                      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                  {p.isOrganic && (
                    <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow">
                      Organic
                    </span>
                  )}
                  <button
                    onClick={() => handleRemove(p._id)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow hover:bg-rose-50 transition"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {p.location?.district || 'Regional'}
                    </div>
                    <Link
                      to={`/products/${p._id}`}
                      className="text-sm font-extrabold text-slate-900 hover:text-krishi-600 transition line-clamp-1 mt-0.5"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-krishi-600" />
                      <span className="truncate">{farmerName}</span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-base font-black text-slate-900">{formatCurrency(p.price)}</span>
                      <span className="text-xs text-slate-400 font-semibold"> {formatUnit(p.unit)}</span>
                    </div>
                    {isOutOfStock ? (
                      <span className="text-[10px] font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        In Stock ({p.quantity} {p.unit})
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleMoveToCart(p)}
                    disabled={isOutOfStock}
                    className="w-full py-2.5 bg-krishi-600 hover:bg-krishi-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {isOutOfStock ? 'Sold Out' : 'Move to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
