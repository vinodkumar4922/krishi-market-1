import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import {
  CheckCircle,
  MapPin,
  Star,
  ShoppingBag,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { formatCurrency, formatUnit, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';

const FarmerProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addedToast, setAddedToast] = useState('');
  const { addToCart } = useCart();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/farmers/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch farmer profile:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    if (product.quantity <= 0) return;
    addToCart(product, 1);
    setAddedToast(`${product.name} added to cart!`);
    setTimeout(() => setAddedToast(''), 2500);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading producer credentials..." />;
  }

  if (!data || !data.farmer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Farmer Profile Not Found</h2>
        <p className="text-slate-500 text-sm">The producer you are looking for is not registered or unavailable.</p>
        <Link to="/marketplace" className="inline-block px-5 py-2.5 bg-krishi-600 text-white rounded-xl font-bold text-xs">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const { farmer, products = [], reviews = [] } = data;
  const isApproved = farmer.verificationStatus === 'APPROVED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Toast */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <CheckCircle className="w-5 h-5 text-krishi-400" />
          <span className="text-sm font-semibold">{addedToast}</span>
        </div>
      )}

      {/* Back to Marketplace */}
      <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-krishi-600">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      {/* Farmer Hero Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {farmer.user?.name || 'Regional Producer'}
            </h1>
            {isApproved && (
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Verified Producer
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 flex items-center gap-1.5 font-medium">
            <MapPin className="w-4 h-4 text-krishi-600 flex-shrink-0" />
            {farmer.farmLocation?.address}, {farmer.farmLocation?.district}, {farmer.farmLocation?.state} — PIN {farmer.farmLocation?.pincode}
          </p>

          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl pt-1">
            {farmer.bio || 'Dedicated regional agricultural producer practicing direct-to-consumer farming with sustainable land management.'}
          </p>

          {/* Crop Types Pills */}
          {farmer.cropTypes && farmer.cropTypes.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Cultivated Crops:</span>
              {farmer.cropTypes.map((crop, idx) => (
                <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                  {crop}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Telemetry Stats Strip */}
        <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-8 border-slate-100 w-full lg:w-auto justify-between lg:justify-start">
          <div className="text-center px-3">
            <div className="text-2xl font-black text-slate-900">{farmer.experienceYears || 1} Yrs</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Experience</div>
          </div>

          <div className="text-center px-3 border-x border-slate-100">
            <div className="text-2xl font-black text-slate-900">{farmer.farmSizeAcres || 1}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Acres Farmed</div>
          </div>

          <div className="text-center px-3">
            <div className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
              <Star className="w-5 h-5 fill-amber-400" /> {farmer.rating?.average || 5.0}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">{farmer.rating?.count || 0} Reviews</div>
          </div>

          <div className="text-center px-3 border-l border-slate-100">
            <div className="text-xs font-black text-slate-700">{formatDate(farmer.createdAt)}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Joined Platform</div>
          </div>
        </div>
      </div>

      {/* Produce Catalog by this Farmer */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Harvest Produce</h2>
          <p className="text-xs text-slate-500 mt-0.5">Directly harvested from this farmer's registered acreage.</p>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            No active produce listed by this farmer right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const isOutOfStock = p.quantity <= 0;

              return (
                <Link
                  key={p._id}
                  to={`/products/${p._id}`}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden group"
                >
                  <div className="h-40 bg-slate-100 overflow-hidden relative">
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {p.isOrganic && (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                        Organic
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-krishi-600 uppercase">{p.category?.name || 'Produce'}</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">{p.name}</h3>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Harvested: {formatDate(p.harvestDate)}
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-base font-black text-slate-900">{formatCurrency(p.price)}</span>
                        <span className="text-xs text-slate-400 font-semibold"> {formatUnit(p.unit)}</span>
                      </div>
                      <button
                        onClick={(e) => handleAddToCart(p, e)}
                        disabled={isOutOfStock}
                        className="p-2 bg-krishi-600 hover:bg-krishi-700 disabled:bg-slate-200 text-white rounded-xl shadow-sm transition"
                        title="Add to cart"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Feedback for this Farmer */}
      <div className="pt-6 border-t border-slate-200 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verified Consumer Feedback</h2>
          <p className="text-xs text-slate-500 mt-0.5">Reviews submitted across all crops fulfilled by this farmer.</p>
        </div>

        {reviews.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400 text-center">
            No public reviews posted yet for this farmer.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r._id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{r.consumer?.name || 'Verified Buyer'}</span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-extrabold">
                    <Star className="w-3 h-3 fill-amber-400" /> {r.farmerRating || r.productRating}/5
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                <div className="text-[10px] text-slate-400">{formatDate(r.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerProfile;
