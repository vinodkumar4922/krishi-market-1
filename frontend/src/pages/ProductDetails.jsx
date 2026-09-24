import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import {
  CheckCircle,
  Star,
  MapPin,
  Calendar,
  Sprout,
  ShieldCheck,
  ShoppingBag,
  Heart,
  Truck,
  ArrowLeft,
} from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    fetchProductAndReviews();
  }, [id]);

  const fetchProductAndReviews = async () => {
    setLoading(true);
    try {
      const [prodRes, revRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/reviews/product/${id}`),
      ]);
      if (prodRes.data.success) setProduct(prodRes.data.data);
      if (revRes.data.success) setReviews(revRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (!product) return;
    addToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  if (loading) return <div className="p-16 text-center text-slate-500 font-bold">Loading harvest details...</div>;
  if (!product) return <div className="p-16 text-center text-red-500 font-bold">Product not found.</div>;

  const farmer = product.farmer;
  const isOutOfStock = product.quantity <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-krishi-600">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Product Visual */}
        <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm h-96 relative">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.isOrganic && (
            <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wider shadow">
              100% Organic
            </span>
          )}
        </div>

        {/* Product Information & Purchase */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-krishi-600">{product.category?.name}</span>
            <h1 className="text-3xl font-black text-slate-900 mt-1">{product.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{product.rating?.average || '5.0'}</span>
                <span className="text-slate-400 font-normal">({product.rating?.count || 0} reviews)</span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-krishi-600" /> {product.location?.district}, {product.location?.state}
              </span>
            </div>
          </div>

          <div className="text-3xl font-black text-slate-900 flex items-baseline gap-2">
            ₹{product.price}
            <span className="text-sm font-semibold text-slate-400">/ {product.unit}</span>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>

          {/* Traceability card: Know Your Farmer */}
          <div className="p-4 rounded-2xl bg-krishi-50 border border-krishi-200 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-krishi-800">Direct Farmer Traceability</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  {farmer?.user?.name} <CheckCircle className="w-4 h-4 text-krishi-600" />
                </div>
                <div className="text-xs text-slate-500">
                  {farmer?.farmLocation?.address}, {farmer?.farmLocation?.district}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold text-krishi-700 bg-white px-2 py-0.5 rounded-md border border-krishi-200">
                  {product.farmingMethod}
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Controls */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center border rounded-xl p-1 bg-slate-50">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 font-bold text-slate-600 hover:text-slate-900"
              >
                -
              </button>
              <span className="px-4 font-bold text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                disabled={quantity >= product.quantity}
                className="px-3 py-1 font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className="flex-1 py-3 bg-krishi-600 hover:bg-krishi-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              {isOutOfStock ? 'Sold Out' : 'Add Harvest to Cart'}
            </button>
          </div>

          {addedToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Added to your cart!
            </div>
          )}
        </div>
      </div>

      {/* Verified Reviews Section */}
      <div className="pt-10 border-t border-slate-200">
        <h3 className="text-xl font-black text-slate-900 mb-6">Verified Customer Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-xs text-slate-400">No verified reviews submitted yet.</p>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {reviews.map((r) => (
              <div key={r._id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{r.consumer?.name || 'Verified Buyer'}</span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {r.productRating}/5
                  </div>
                </div>
                <p className="text-xs text-slate-600">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
