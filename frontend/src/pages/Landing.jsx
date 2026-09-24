import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShoppingBag, ShieldCheck, HeartHandshake, CheckCircle, ArrowRight, Star } from 'lucide-react';

const Landing = () => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-krishi-50/80 to-white py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-krishi-100 border border-krishi-200 text-krishi-800 text-xs font-black uppercase tracking-wider mb-6">
            <Sprout className="w-4 h-4 text-krishi-600" /> Direct Farmer-to-Consumer Agri Ecosystem
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Buy Fresh Farm Produce. <br />
            <span className="text-krishi-600">Empower Local Farmers.</span>
          </h1>

          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            Cut out intermediaries. Source chemical-free vegetables, heirloom grains, and A2 dairy directly from verified regional growers with complete harvest traceability.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/marketplace"
              className="px-8 py-3.5 bg-krishi-600 hover:bg-krishi-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
            >
              Explore Fresh Harvests <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
            >
              Join as a Verified Farmer
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Impact Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Admin Verified Farmers</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every farmer profile and farm location is vetted before harvest products can be listed. Zero anonymous resellers.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-krishi-100 text-krishi-600 rounded-2xl flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">+38.5% Farmer Realization</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              By removing multi-tier middle-layer agents, farmers retain true market value while consumers enjoy fresher produce at fair rates.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">100% Traceability</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Know your farmer, farm district, farming method (organic, natural, conventional), and harvest date on every order.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
