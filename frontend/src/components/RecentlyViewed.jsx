import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Sprout, ArrowRight } from 'lucide-react';
import { recentlyViewedManager } from '../utils/recentlyViewed';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatUnit } from '../utils/formatters';

const RecentlyViewed = ({ currentProductId = null }) => {
  const { user } = useAuth();
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    const items = recentlyViewedManager.get(user?._id);
    // Don't show current product if on its details page
    const filtered = currentProductId
      ? items.filter((item) => item._id !== currentProductId)
      : items;
    setRecentItems(filtered);
  }, [user?._id, currentProductId]);

  if (recentItems.length === 0) return null;

  return (
    <div className="pt-8 border-t border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-krishi-600" /> Recently Viewed Produce
        </h3>
        <Link
          to="/marketplace"
          className="text-xs font-bold text-krishi-600 hover:text-krishi-700 flex items-center gap-1"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {recentItems.slice(0, 6).map((item) => (
          <Link
            key={item._id}
            to={`/products/${item._id}`}
            className="group bg-white rounded-2xl border border-slate-200 p-3 shadow-sm hover:shadow-md hover:border-krishi-300 transition flex flex-col"
          >
            <div className="h-28 rounded-xl overflow-hidden bg-slate-100 mb-2 relative">
              <img
                src={
                  item.image ||
                  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80'
                }
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              {item.isOrganic && (
                <span className="absolute top-1.5 left-1.5 bg-emerald-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                  Organic
                </span>
              )}
            </div>

            <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-krishi-600 transition">
              {item.name}
            </h4>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs font-extrabold text-slate-900">{formatCurrency(item.price)}</span>
              <span className="text-[10px] text-slate-400 font-medium">{formatUnit(item.unit)}</span>
            </div>

            <div className="mt-auto pt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>{item.district || 'Regional'}</span>
              <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                <Star className="w-2.5 h-2.5 fill-amber-400" />
                {item.rating}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;
