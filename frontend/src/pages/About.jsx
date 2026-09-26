import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  ShieldCheck,
  HeartHandshake,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Users,
  Award,
  ArrowRight,
} from 'lucide-react';

const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3.5 py-1.5 rounded-full bg-krishi-100 text-krishi-800 text-xs font-black uppercase tracking-wider border border-krishi-200">
          Our Story & Mission
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Transforming Indian Agriculture Through Direct Farm Commerce
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Krishi Market was founded with a singular purpose: to dismantle predatory intermediary cartels and return
          economic sovereignty to India's hardworking farmers while delivering unadulterated, wholesome food to urban families.
        </p>
      </div>

      {/* Problem vs Solution Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* The Problem */}
        <div className="bg-rose-50/50 p-8 rounded-3xl border border-rose-200/60 space-y-4">
          <div className="inline-block px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-black uppercase">
            The Broken Legacy System
          </div>
          <h2 className="text-2xl font-black text-slate-900">Why the Traditional APMC Model Failed Farmers</h2>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">✕</span>
              <span><strong>40% to 60% Margin Loss:</strong> Middlemen, transport aggregators, and commission brokers skim the vast majority of consumer retail spend.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">✕</span>
              <span><strong>Severe Distress Selling:</strong> Smallholders lack direct market access and storage, forcing them to sell fresh harvests at loss-making spot prices.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">✕</span>
              <span><strong>Adulteration & Stale Produce:</strong> Food travels through 4–6 distribution nodes over 3–5 days, losing vital nutrients and freshness.</span>
            </li>
          </ul>
        </div>

        {/* The Solution */}
        <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-200/60 space-y-4">
          <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase">
            The Krishi Market Solution
          </div>
          <h2 className="text-2xl font-black text-slate-900">Direct Farmer-to-Consumer Market Architecture</h2>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>+38.5% Direct Realization:</strong> Farmers set their own produce prices and receive direct, transparent payments.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>Harvest-Within-24h Guarantee:</strong> Fresh produce is picked to order and delivered at peak nutritional value.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>Verifiable Traceability:</strong> Every item explicitly links back to the grower, soil certification, and harvest date.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-krishi-100 text-krishi-700 flex items-center justify-center">
            <Sprout className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Our Mission</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To empower regional farmers with fair digital infrastructure, equitable market pricing, and direct consumer relationships, ensuring sustainable agrarian prosperity for future generations.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Our Vision</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            A transparent agricultural ecosystem where every household knows where their food comes from, and every farmer thrives through honest, direct-to-consumer trade.
          </p>
        </div>
      </div>

      {/* Local Karnataka Agriculture Focus */}
      <div className="bg-slate-900 text-white p-8 sm:p-12 rounded-3xl shadow-xl space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Regional Roots</span>
          <h2 className="text-2xl sm:text-3xl font-black">Proudly Rooted in Karnataka's Agrarian Belts</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            From the dryland organic jowar and pomegranate orchards of Vijayapura and Bagalkot to the fertile vegetable hubs of Kolar, Belagavi, and Dharwad, we partner directly with certified cultivators across the state.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold pt-4 border-t border-slate-800">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-emerald-400 block text-base font-black">Vijayapura</span>
            <span className="text-slate-400 text-[11px]">Organic Pomegranates & Tomatoes</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-emerald-400 block text-base font-black">Dharwad</span>
            <span className="text-slate-400 text-[11px]">Alphonso Mangoes & Pulses</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-emerald-400 block text-base font-black">Bagalkot</span>
            <span className="text-slate-400 text-[11px]">Desi Grains & A2 Milk</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-emerald-400 block text-base font-black">Kolar</span>
            <span className="text-slate-400 text-[11px]">Vine Tomatoes & Leafy Greens</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-6">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 px-8 py-4 bg-krishi-600 hover:bg-krishi-700 text-white font-black rounded-2xl shadow-lg transition"
        >
          Explore Fresh Harvests Today <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default About;
