import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import RecentlyViewed from '../components/RecentlyViewed';
import {
  Search,
  CheckCircle,
  Sprout,
  ShoppingBag,
  Star,
  MapPin,
  Heart,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatUnit, formatDate } from '../utils/formatters';

const Marketplace = () => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 12 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [districtFilter, setDistrictFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Price filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Wishlist state tracking
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const { addToCart } = useCart();
  const [toastMessage, setToastMessage] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchWishlistIds = useCallback(async () => {
    try {
      const res = await api.get('/consumer/wishlist');
      if (res.data.success && res.data.data.products) {
        const ids = new Set(res.data.data.products.map((p) => p._id || p));
        setWishlistIds(ids);
      }
    } catch {
      // Ignore
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 12,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (organicOnly) params.isOrganic = 'true';
      if (districtFilter) params.district = districtFilter;
      if (availabilityFilter && availabilityFilter !== 'ALL') params.availability = availabilityFilter;
      if (sortOption) params.sort = sortOption;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await api.get('/products', { params });
      if (res.data.success) {
        setProducts(res.data.data);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    searchTerm,
    selectedCategory,
    organicOnly,
    districtFilter,
    availabilityFilter,
    sortOption,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {
    fetchCategories();
    if (isAuthenticated) {
      fetchWishlistIds();
    }
  }, [isAuthenticated, fetchCategories, fetchWishlistIds]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    if (product.quantity <= 0) return;
    addToCart(product, 1);
    showToast(`${product.name} added to cart!`);
  };

  const handleToggleWishlist = async (productId, e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to save items to your wishlist.');
      return;
    }

    try {
      const res = await api.post('/consumer/wishlist/toggle', { productId });
      if (res.data.success) {
        const updated = new Set(wishlistIds);
        if (updated.has(productId)) {
          updated.delete(productId);
          showToast('Removed from wishlist');
        } else {
          updated.add(productId);
          showToast('Saved to harvest wishlist!');
        }
        setWishlistIds(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setOrganicOnly(false);
    setDistrictFilter('');
    setAvailabilityFilter('ALL');
    setMinPrice('');
    setMaxPrice('');
    setSortOption('newest');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <CheckCircle className="w-5 h-5 text-krishi-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Main Search Bar */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Direct Farmer Marketplace
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Explore fresh harvests with 100% farm-to-fork traceability directly from regional producers.
        </p>

        {/* Search & Main Filter Controls */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by crop, vegetable, fruit, farmer, or region..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-krishi-500 shadow-sm text-sm"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-krishi-500"
            >
              <option value="">All Regions</option>
              <option value="Vijayapura">Vijayapura</option>
              <option value="Bengaluru">Bengaluru Rural</option>
              <option value="Bagalkot">Bagalkot</option>
              <option value="Dharwad">Dharwad</option>
              <option value="Belagavi">Belagavi</option>
              <option value="Nashik">Nashik</option>
              <option value="Pune">Pune</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-krishi-500"
            >
              <option value="newest">Recently Listed</option>
              <option value="harvest">Freshly Harvested</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Secondary Filters Bar (Category Pills, Organic Toggle, Availability, Price) */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              setSelectedCategory('');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === ''
                ? 'bg-krishi-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>

          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => {
                setSelectedCategory(c._id);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === c._id
                  ? 'bg-krishi-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.name}
            </button>
          ))}

          <button
            onClick={() => {
              setOrganicOnly(!organicOnly);
              setCurrentPage(1);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              organicOnly
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" /> 100% Organic Only
          </button>

          {/* Availability filter */}
          <select
            value={availabilityFilter}
            onChange={(e) => {
              setAvailabilityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700"
          >
            <option value="ALL">All Stock</option>
            <option value="IN_STOCK">In Stock Only</option>
            <option value="LOW_STOCK">Low Stock</option>
          </select>

          {(searchTerm || selectedCategory || organicOnly || districtFilter || availabilityFilter !== 'ALL') && (
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-slate-400 hover:text-red-600 ml-auto transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* 7. PRODUCT GRID WITH COMPLETE SPEC CARDS */}
      {/* ================================================== */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse h-80"></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center my-8 shadow-sm">
          <div className="w-16 h-16 bg-krishi-50 text-krishi-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900">No agricultural produce found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">Try adjusting your filters or search keywords.</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-krishi-600 text-white rounded-xl text-xs font-bold shadow"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => {
            const isOutOfStock = p.quantity <= 0;
            const isLowStock = p.quantity > 0 && p.quantity <= 5;
            const farmerName = p.farmer?.user?.name || 'Verified Farmer';
            const isWishlisted = wishlistIds.has(p._id);

            return (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition flex flex-col overflow-hidden group"
              >
                {/* Product Image & Badges */}
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <Link to={`/products/${p._id}`}>
                    <img
                      src={
                        p.images?.[0] ||
                        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </Link>

                  {/* Organic Badge */}
                  {p.isOrganic && (
                    <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider shadow">
                      Organic
                    </span>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleToggleWishlist(p._id, e)}
                    className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow transition ${
                      isWishlisted
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/90 text-slate-500 hover:text-rose-500 hover:bg-white'
                    }`}
                    title="Bookmark to Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>

                  {/* Stock Status Tag */}
                  <div className="absolute bottom-2 left-2.5">
                    {isOutOfStock ? (
                      <span className="bg-red-600/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow">
                        Sold Out
                      </span>
                    ) : isLowStock ? (
                      <span className="bg-amber-600/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow">
                        Low Stock ({p.quantity} left)
                      </span>
                    ) : (
                      <span className="bg-slate-900/70 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur">
                        In Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>{p.category?.name || 'Produce'}</span>
                      <span className="text-amber-500 flex items-center gap-0.5 font-extrabold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {p.rating?.average || 5.0} ({p.rating?.count || 0})
                      </span>
                    </div>

                    <Link
                      to={`/products/${p._id}`}
                      className="text-base font-extrabold text-slate-900 hover:text-krishi-600 transition line-clamp-1 mt-1"
                    >
                      {p.name}
                    </Link>

                    {/* Farmer with Verified Badge */}
                    <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-krishi-600 flex-shrink-0" />
                      <Link
                        to={p.farmer?._id ? `/farmers/${p.farmer._id}` : '#'}
                        className="hover:underline truncate font-medium text-slate-700"
                      >
                        {farmerName}
                      </Link>
                    </div>

                    {/* Location & Harvest Date */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-krishi-600" />
                        {p.location?.district}, {p.location?.state}
                      </span>
                      <span>{formatDate(p.harvestDate)}</span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-lg font-black text-slate-900">{formatCurrency(p.price)}</span>
                      <span className="text-xs text-slate-400 font-semibold"> {formatUnit(p.unit)}</span>
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(p, e)}
                      disabled={isOutOfStock}
                      className="p-2.5 bg-krishi-600 hover:bg-krishi-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl shadow-sm transition flex items-center justify-center"
                      title={isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================== */}
      {/* 11. PAGINATION BAR */}
      {/* ================================================== */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <div className="text-xs text-slate-500 font-medium">
            Showing Page <span className="font-bold text-slate-800">{pagination.page}</span> of{' '}
            <span className="font-bold text-slate-800">{pagination.pages}</span> ({pagination.total} total items)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-8 h-8 rounded-xl text-xs font-extrabold transition ${
                  currentPage === num
                    ? 'bg-krishi-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
              disabled={currentPage >= pagination.pages}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 15. RECENTLY VIEWED PRODUCTS DRAWER */}
      <RecentlyViewed />
    </div>
  );
};

export default Marketplace;
