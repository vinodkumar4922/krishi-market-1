import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { recentlyViewedManager } from '../utils/recentlyViewed';
import RecentlyViewed from '../components/RecentlyViewed';
import {
  CheckCircle,
  Star,
  MapPin,
  Calendar,
  Sprout,
  ShoppingBag,
  Heart,
  ChevronRight,
  Clock,
  Award,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { addToCart } = useCart();

  const fetchProductAndReviews = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, revRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/reviews/product/${id}`),
      ]);

      if (prodRes.data.success) {
        const prodData = prodRes.data.data;
        setProduct(prodData);
        // Log to recently viewed
        recentlyViewedManager.add(user?._id, prodData);
      }

      if (revRes.data.success) {
        setReviews(revRes.data.data);
      }

      // Check if wishlisted if logged in
      if (isAuthenticated) {
        try {
          const wRes = await api.get('/consumer/wishlist');
          if (wRes.data.success) {
            const hasItem = wRes.data.data.products?.some(
              (p) => (p._id || p) === id
            );
            setIsWishlisted(Boolean(hasItem));
          }
        } catch {
          // Ignore wishlist check error
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, user?._id, isAuthenticated]);

  useEffect(() => {
    fetchProductAndReviews();
  }, [fetchProductAndReviews]);

  const handleAddToCart = () => {
    if (!product || product.quantity <= 0) return;
    addToCart(product, quantity);
    showToast(`Added ${quantity} ${product.unit} to your cart!`);
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to save items to your wishlist.');
      return;
    }

    try {
      const res = await api.post('/consumer/wishlist/toggle', { productId: product._id });
      if (res.data.success) {
        const nextState = !isWishlisted;
        setIsWishlisted(nextState);
        showToast(nextState ? 'Saved to your harvest wishlist!' : 'Removed from wishlist.');
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Fetching harvest traceability telemetry..." />;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Harvest Listing Not Found</h2>
        <p className="text-slate-500 text-sm">This produce may have been completed or removed by the farmer.</p>
        <Link to="/marketplace" className="inline-block px-5 py-2.5 bg-krishi-600 text-white rounded-xl font-bold text-xs">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const farmer = product.farmer;
  const isOutOfStock = product.quantity <= 0;
  const isLowStock = product.quantity > 0 && product.quantity <= 5;
  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <CheckCircle className="w-5 h-5 text-krishi-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link to="/" className="hover:text-slate-700 transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/marketplace" className="hover:text-slate-700 transition">Marketplace</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-krishi-600 font-bold truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Images Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm h-96 sm:h-[450px] relative">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.isOrganic && (
              <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-black px-3.5 py-1 rounded-xl uppercase tracking-wider shadow-md flex items-center gap-1.5">
                <Sprout className="w-4 h-4" /> 100% Certified Organic
              </span>
            )}
            <button
              onClick={handleToggleWishlist}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition ${
                isWishlisted
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/90 text-slate-600 hover:text-rose-500 hover:bg-white'
              }`}
              title="Bookmark to Wishlist"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Image Thumbnails if Multiple */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                    selectedImage === idx ? 'border-krishi-600 ring-2 ring-krishi-400' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase Column */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-krishi-600 bg-krishi-50 px-2.5 py-0.5 rounded-lg border border-krishi-200">
                {product.category?.name || 'Produce'}
              </span>
              <span className="text-xs font-bold uppercase text-slate-400">
                Method: {product.farmingMethod}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="font-extrabold text-slate-900 text-sm">{product.rating?.average || '5.0'}</span>
                <span className="text-slate-400 font-normal">({product.rating?.count || 0} reviews)</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-krishi-600" />
                <span>{product.location?.district}, {product.location?.state}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-krishi-600" />
                <span>Harvested: {formatDate(product.harvestDate)}</span>
              </div>
            </div>
          </div>

          {/* Pricing & Stock Status */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-slate-900">
                {formatCurrency(product.price)}
                <span className="text-sm font-semibold text-slate-400 ml-1">/ {product.unit}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                100% Direct Sale • Zero Middleman Markup
              </div>
            </div>

            <div>
              {isOutOfStock ? (
                <span className="px-3.5 py-1.5 rounded-xl bg-red-100 text-red-700 font-extrabold text-xs">
                  Sold Out
                </span>
              ) : isLowStock ? (
                <span className="px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Only {product.quantity} {product.unit} left!
                </span>
              ) : (
                <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Fresh in Stock ({product.quantity} {product.unit})
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">About this Harvest</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Purchase Controls */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-lg font-black text-slate-700 hover:bg-white transition flex items-center justify-center"
                >
                  -
                </button>
                <span className="px-4 font-black text-sm text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                  disabled={quantity >= product.quantity}
                  className="w-9 h-9 rounded-lg font-black text-slate-700 hover:bg-white disabled:opacity-30 transition flex items-center justify-center"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 bg-krishi-600 hover:bg-krishi-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                {isOutOfStock ? 'Currently Unavailable' : `Add ${quantity} ${product.unit} to Cart • ${formatCurrency(product.price * quantity)}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 13. KNOW YOUR FARMER — DIRECT TRANSPARENCY SECTION */}
      {/* ================================================== */}
      <div className="rounded-3xl bg-gradient-to-br from-krishi-900 to-slate-900 text-white p-8 sm:p-10 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-krishi-500/20 text-krishi-300 text-xs font-extrabold border border-krishi-400/30 mb-2">
              <Award className="w-3.5 h-3.5" /> Farm-to-Fork Direct Traceability
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Know Your Producer</h2>
            <p className="text-slate-400 text-xs mt-1">
              Krishi Market eliminates hidden food supply chains. Here is exactly who produced your food:
            </p>
          </div>

          {farmer?._id && (
            <Link
              to={`/farmers/${farmer._id}`}
              className="px-5 py-2.5 bg-white text-slate-900 hover:bg-krishi-50 text-xs font-black rounded-xl shadow transition self-start sm:self-auto flex items-center gap-1.5"
            >
              View Farmer Profile <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* 6-Step Verification Chain */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-krishi-400 block">1. Producer</span>
            <div className="text-sm font-extrabold truncate">{farmer?.user?.name || 'Local Farmer'}</div>
            <span className="text-[10px] text-slate-400 block">Verified KYC</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-krishi-400 block">2. Farm Name</span>
            <div className="text-sm font-extrabold truncate">{farmer?.farmName || 'Regional Family Farm'}</div>
            <span className="text-[10px] text-slate-400 block">{farmer?.farmSizeAcres || 1} Acres Cultivated</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-krishi-400 block">3. Location</span>
            <div className="text-sm font-extrabold truncate">{farmer?.farmLocation?.district}, {farmer?.farmLocation?.state}</div>
            <span className="text-[10px] text-slate-400 block">PIN: {farmer?.farmLocation?.pincode}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-krishi-400 block">4. Method</span>
            <div className="text-sm font-extrabold truncate text-emerald-400">{product.farmingMethod}</div>
            <span className="text-[10px] text-slate-400 block">{product.isOrganic ? 'Zero Synthetic Spray' : 'Traditional'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-krishi-400 block">5. Harvested</span>
            <div className="text-sm font-extrabold truncate">{formatDate(product.harvestDate)}</div>
            <span className="text-[10px] text-slate-400 block">Direct Farm Gate</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-krishi-400 block">6. Producer Rating</span>
            <div className="text-sm font-extrabold truncate text-amber-400 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400" /> {farmer?.rating?.average || 5.0}/5
            </div>
            <span className="text-[10px] text-slate-400 block">{farmer?.rating?.count || 0} Verified Reviews</span>
          </div>
        </div>
      </div>

      {/* Verified Reviews Section */}
      <div className="pt-8 border-t border-slate-200 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Verified Buyer Feedback</h3>
            <p className="text-xs text-slate-500 mt-0.5">Reviews submitted exclusively by verified delivery recipients.</p>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <span className="text-lg font-black text-slate-900">{product.rating?.average || '5.0'}</span>
            <span className="text-xs text-slate-400">({reviews.length} reviews)</span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            No customer reviews posted for this batch yet. Reviews are unlocked once an order is marked DELIVERED.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r._id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-krishi-100 text-krishi-700 font-bold text-xs flex items-center justify-center">
                      {(r.consumer?.name || 'V')[0]}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">{r.consumer?.name || 'Verified Buyer'}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold block">Verified Purchase</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-extrabold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {r.productRating}/5
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">{r.comment}</p>
                <div className="text-[10px] text-slate-400">{formatDate(r.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 15. RECENTLY VIEWED PRODUCTS DRAWER */}
      <RecentlyViewed currentProductId={product._id} />
    </div>
  );
};

export default ProductDetails;
