import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Sprout,
  ShoppingBag,
  ShieldCheck,
  HeartHandshake,
  CheckCircle,
  ArrowRight,
  Star,
  Truck,
  Leaf,
  Users,
  Award,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
} from 'lucide-react';

const Landing = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredFarmers, setFeaturedFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [prodRes, farmerRes] = await Promise.all([
          api.get('/products/featured'),
          api.get('/farmers?limit=4'),
        ]);

        if (prodRes.data.success && prodRes.data.data.length > 0) {
          setFeaturedProducts(prodRes.data.data.slice(0, 4));
        }
        if (farmerRes.data.success && farmerRes.data.data.length > 0) {
          setFeaturedFarmers(farmerRes.data.data.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load landing data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-krishi-50/90 via-emerald-50/40 to-white py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-krishi-100 border border-krishi-200 text-krishi-800 text-xs font-black uppercase tracking-wider shadow-sm">
            <Sprout className="w-4 h-4 text-krishi-600" /> Karnataka Direct Agri Marketplace
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Buy Fresh. <span className="text-krishi-600">Support Farmers.</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Direct farmer-to-consumer agricultural ecosystem. Cut out intermediary markups, source certified organic
            harvests, and enjoy transparent harvest traceability from regional farms to your kitchen.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/marketplace"
              className="w-full sm:w-auto px-8 py-4 bg-krishi-600 hover:bg-krishi-700 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
            >
              <ShoppingBag className="w-4 h-4" /> Explore Fresh Marketplace
            </Link>
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-black rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Sprout className="w-4 h-4 text-krishi-600" /> Register as a Farmer
            </Link>
          </div>

          {/* Quick Value Metrics */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-2xl font-black text-krishi-600">+38.5%</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">Direct Farmer Income</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-2xl font-black text-emerald-600">&lt;24 Hours</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">Farm to Doorstep</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-2xl font-black text-blue-600">100%</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">Verified Origin</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-2xl font-black text-amber-500">Zero</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">Middlemen Fees</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Produce Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-krishi-600 mb-1">Today's Harvest</div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Featured Fresh Farm Produce</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Harvested within the last 24 hours by verified regional growers.
            </p>
          </div>
          <Link
            to="/marketplace"
            className="text-xs font-bold text-krishi-600 hover:text-krishi-700 flex items-center gap-1 group"
          >
            Browse Full Marketplace <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Loading today's handpicked harvests from regional orchards and farms...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <div
                key={p._id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {p.isOrganic ? '🌱 Organic' : 'Conventional'}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {p.location?.district || 'Karnataka'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-krishi-600 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-slate-900">₹{p.price}</span>
                      <span className="text-xs text-slate-400">/{p.unit}</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      In Stock
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    By {p.farmer?.user?.name || p.farmer?.farmName || 'Verified Farm'}
                  </span>
                  <Link
                    to={`/products/${p._id}`}
                    className="px-3 py-1.5 bg-krishi-600 hover:bg-krishi-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. How It Works (Supply Chain Flow) */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 rounded-3xl max-w-7xl mx-auto shadow-xl">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Transparent Pipeline</span>
          <h2 className="text-3xl font-black">How Krishi Market Works</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            A reliable digital bridge connecting Karnataka's farmers directly with households.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative">
          <div className="space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30 text-xl font-black">
              1
            </div>
            <h3 className="text-base font-bold">Farmer Harvests & Lists Produce</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Verified farmers list daily morning yields with transparent prices, harvest dates, and real farm inventory.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-14 h-14 bg-krishi-500/20 text-krishi-400 rounded-2xl flex items-center justify-center mx-auto border border-krishi-500/30 text-xl font-black">
              2
            </div>
            <h3 className="text-base font-bold">Consumer Orders with Traceability</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Buyers choose certified organic fruits, vegetables, and grains across multiple regional farmers in a unified cart.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30 text-xl font-black">
              3
            </div>
            <h3 className="text-base font-bold">Morning Express Delivery</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Produce is packed at farmgate and delivered directly to the doorstep in pre-booked fresh morning delivery slots.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Organic & Chemical-Free Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-800 to-krishi-800 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-black uppercase tracking-wider">
              100% Chemical-Free
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Eat Wholesome. Live Naturally with Authentic Organic Harvests.
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Every certified organic producer on Krishi Market adheres to strict natural farming practices without synthetic pesticides or ripening agents. Look for the Verified Organic badge on every listing.
            </p>
            <div className="pt-2">
              <Link
                to="/marketplace?isOrganic=true"
                className="px-6 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-black inline-flex items-center gap-2 shadow transition"
              >
                Shop Organic Only <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
              <Leaf className="w-6 h-6 text-emerald-300 mx-auto mb-1" />
              <div className="text-sm font-bold">Natural Bio-Inputs</div>
              <div className="text-[10px] text-emerald-200">Zero Synthetic Sprays</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
              <Award className="w-6 h-6 text-emerald-300 mx-auto mb-1" />
              <div className="text-sm font-bold">Soil Inspected</div>
              <div className="text-[10px] text-emerald-200">Verified Credentials</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Benefits Comparison Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="text-xs font-black uppercase tracking-wider text-krishi-600">Fair Trade & Equity</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Why Krishi Market is Better</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Farmer Card */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-krishi-100 text-krishi-700 flex items-center justify-center">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">For Regional Farmers</h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Full Price Realization:</strong> Direct sales yield +38.5% more income vs APMC commissions.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>No Forced Distress Selling:</strong> Set fair prices based on actual production costs.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Direct Customer Trust:</strong> Cultivate loyal household buyers who appreciate quality.</span>
              </li>
            </ul>
          </div>

          {/* Consumer Card */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">For Smart Consumers</h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Harvested Fresh:</strong> Receive produce picked within 24 hours, not stored in cold storage for weeks.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Complete Traceability:</strong> Know the exact village, farmer, and harvest date of your food.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Purchase-Gated Reviews:</strong> Read real feedback from buyers who actually received the harvest.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Testimonials */}
      <section className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-krishi-600">Real Voices</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Trusted by Growers and Families</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "Krishi Market eliminated the predatory commission agents who used to take half of my tomato earnings. I receive payments on time and know my customers directly."
              </p>
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-900">Ramesh Patil</div>
                <div className="text-[11px] text-slate-400">Organic Farmer, Vijayapura</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "The leafy vegetables and desi tomatoes we received were crisp, fresh, and smelled of real soil. It feels good knowing 100% of our money directly supports hardworking farmers."
              </p>
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-900">Anita Sharma</div>
                <div className="text-[11px] text-slate-400">Consumer, Bengaluru</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "The morning express delivery slot is dependable. Fresh cow milk and seasonal pomegranate arrived right on time before breakfast."
              </p>
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-900">Vikram Rao</div>
                <div className="text-[11px] text-slate-400">Consumer, Bengaluru Urban</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call To Action Footer Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-krishi-700 to-emerald-700 text-white p-8 sm:p-12 rounded-3xl text-center space-y-6 shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-black max-w-2xl mx-auto">
            Ready to Experience Fresh Harvests Straight from Regional Farms?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Join hundreds of families across Karnataka who choose fresh, wholesome, and direct agri-produce every day.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Link
              to="/marketplace"
              className="px-8 py-3.5 bg-white text-krishi-800 hover:bg-emerald-50 rounded-2xl font-black text-sm shadow transition"
            >
              Start Shopping Fresh
            </Link>
            <Link
              to="/about"
              className="px-8 py-3.5 bg-emerald-800/80 hover:bg-emerald-800 text-white rounded-2xl font-black text-sm border border-emerald-600 shadow transition"
            >
              Learn About Our Mission
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
