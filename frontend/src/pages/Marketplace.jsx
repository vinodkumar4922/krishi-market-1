import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import {
  Search,
  Filter,
  CheckCircle,
  Sprout,
  ShoppingBag,
  Star,
  MapPin,
  Calendar,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [districtFilter, setDistrictFilter] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  const { addToCart } = useCart();
  const [addedToast, setAddedToast] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, organicOnly, districtFilter, sortOption]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (organicOnly) params.isOrganic = 'true';
      if (districtFilter) params.district = districtFilter;
      if (sortOption) params.sort = sortOption;

      const res = await api.get('/products', { params });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setAddedToast(`${product.name} added to cart!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <CheckCircle className="w-5 h-5 text-krishi-400" />
          <span className="text-sm font-semibold">{addedToast}</span>
        </div>
      )}

      {/* Header & Search Bar */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Direct Farmer Marketplace</h1>
        <p className="text-slate-500 text-sm mt-1">
          Explore fresh harvests directly sourced from verified regional farmers.
        </p>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by vegetable, fruit, grain, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-krishi-500 shadow-sm text-sm"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-4 py-3 bg-white rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-krishi-500"
            >
              <option value="">All Regions</option>
              <option value="Vijayapura">Vijayapura</option>
              <option value="Bengaluru">Bengaluru Rural</option>
              <option value="Bagalkot">Bagalkot</option>
              <option value="Dharwad">Dharwad</option>
              <option value="Nashik">Nashik</option>
            </select>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-4 py-3 bg-white rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-krishi-500"
            >
              <option value="newest">Recently Listed</option>
              <option value="harvest">Freshly Harvested</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Category Pills & Organic Toggle */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory('')}
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
              onClick={() => setSelectedCategory(c._id)}
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
            onClick={() => setOrganicOnly(!organicOnly)}
            className={`ml-auto px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              organicOnly
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" /> 100% Organic Only
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse h-72"></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-8">
          <div className="w-16 h-16 bg-krishi-50 text-krishi-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No agricultural produce found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => {
            const isOutOfStock = p.quantity <= 0;
            const isLowStock = p.quantity > 0 && p.quantity <= 5;
            const farmerName = p.farmer?.user?.name || 'Verified Farmer';

            return (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition flex flex-col overflow-hidden group"
              >
                {/* Product Image & Badges */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                    {p.isOrganic && (
                      <span className="bg-emerald-600/90 backdrop-blur text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow">
                        Organic
                      </span>
                    )}
                    {isLowStock && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                        Only {p.quantity} {p.unit} left
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{p.rating?.average || '5.0'}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
                    <span>{p.category?.name || 'Produce'}</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3 h-3 text-krishi-600" />
                      {p.location?.district || 'Farm Direct'}
                    </span>
                  </div>

                  <Link to={`/products/${p._id}`} className="font-extrabold text-slate-900 hover:text-krishi-600 text-base leading-snug mb-1">
                    {p.name}
                  </Link>

                  {/* Know Your Farmer Badge */}
                  <Link
                    to={`/farmers/${p.farmer?._id}`}
                    className="flex items-center gap-1 text-xs text-slate-600 font-semibold mb-3 hover:underline"
                  >
                    <span>By {farmerName}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-krishi-600" />
                  </Link>

                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-slate-900">₹{p.price}</span>
                      <span className="text-xs text-slate-400 font-medium"> / {p.unit}</span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(p)}
                      disabled={isOutOfStock}
                      className="px-3.5 py-2 bg-krishi-600 hover:bg-krishi-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
