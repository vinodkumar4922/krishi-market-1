import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, MapPin, Sprout, Star, ShieldCheck, ShoppingBag } from 'lucide-react';

const FarmerProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/farmers/${id}`);
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-16 text-center text-slate-500 font-bold">Loading farmer profile...</div>;
  if (!data) return <div className="p-16 text-center text-red-500 font-bold">Farmer profile not found.</div>;

  const { farmer, products } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Farmer Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-slate-900">{farmer.user?.name}</h1>
            {farmer.verificationStatus === 'APPROVED' && (
              <span className="flex items-center gap-1 text-xs font-bold text-krishi-700 bg-krishi-50 px-2.5 py-1 rounded-full border border-krishi-200">
                <CheckCircle className="w-3.5 h-3.5 text-krishi-600" /> Verified Producer
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-krishi-600" />
            {farmer.farmLocation?.address}, {farmer.farmLocation?.district}, {farmer.farmLocation?.state}
          </p>
          <p className="text-xs text-slate-600 mt-3 max-w-xl">{farmer.bio}</p>
        </div>

        <div className="flex gap-4 border-l pl-6 border-slate-100">
          <div className="text-center">
            <div className="text-xl font-black text-slate-900">{farmer.experienceYears} Yrs</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Experience</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-slate-900">{farmer.farmSizeAcres}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Acres</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-amber-500 flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-amber-400" /> {farmer.rating?.average || 5.0}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">{farmer.rating?.count || 0} Reviews</div>
          </div>
        </div>
      </div>

      {/* Products by this Farmer */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-6">Active Produce from {farmer.user?.name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <Link
              key={p._id}
              to={`/products/${p._id}`}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col"
            >
              <div className="h-36 bg-slate-100 rounded-xl overflow-hidden mb-3">
                <img
                  src={p.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{p.name}</h3>
              <div className="mt-auto flex justify-between items-center text-xs">
                <span className="font-black text-slate-900">₹{p.price}/{p.unit}</span>
                <span className="text-krishi-600 font-bold">In Stock ({p.quantity}{p.unit})</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FarmerProfile;
